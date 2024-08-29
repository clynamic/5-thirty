import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import _ from 'lodash';
import { Ticket, tickets } from 'src/api/e621';
import { AxiosAuthService } from 'src/auth';
import { ManifestEntity, ManifestService, ManifestType } from 'src/manifest';
import {
  convertKeysToCamelCase,
  DateRange,
  findContiguityGaps,
  findHighestId,
  findLowestId,
  getDateRangeString,
  getIdRangeString,
  getTwoMonthsRange,
  LoopGuard,
  rateLimit,
} from 'src/utils';

import { TicketCacheEntity, TicketEntity } from '../ticket.entity';
import { FindIncompleteParams, TicketSyncService } from './ticket-sync.service';

@Injectable()
export class TicketSyncWorker {
  constructor(
    private readonly axiosAuthService: AxiosAuthService,
    private readonly ticketSyncService: TicketSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(TicketSyncWorker.name);
  private _isRunning = false;

  get isRunning() {
    return this._isRunning;
  }

  async runOrders() {
    const axiosConfig = this.axiosAuthService.getGlobalConfig();

    const recentlyRange = getTwoMonthsRange();
    const currentDate = dayjs().utc().startOf('day');

    const orders = ManifestService.splitLongOrders(
      await this.manifestService.listOrdersByRange(
        ManifestType.tickets,
        recentlyRange,
      ),
      14,
    );

    for (const order of orders) {
      let page = 1;
      let results: Ticket[] = [];

      const loopGuard = new LoopGuard();

      const dateRange = new DateRange({
        startDate: ManifestService.getBoundaryDate(order.lower, 'end'),
        endDate: ManifestService.getBoundaryDate(order.upper, 'start'),
      });

      this.logger.log(`Fetching tickets for ${dateRange.toRangeString()}`);

      while (true) {
        const result = await rateLimit(
          tickets(
            loopGuard.iter({
              page,
              limit: 320,
              'search[created_at]': dateRange.toRangeString(),
            }),
            axiosConfig,
          ),
        );

        this.logger.log(
          `Found ${result.length} tickets with id range ${getIdRangeString(
            findLowestId(result)?.id,
            findHighestId(result)?.id,
          )} for ${getDateRangeString(dateRange)}`,
        );

        if (result.length === 0) break;

        results = results.concat(result);
        page += 1;
      }

      if (results.length === 0) continue;

      const gaps = findContiguityGaps(results);
      if (gaps.size > 0) {
        this.logger.warn(
          `Found ${gaps.size} gaps in ID contiguity: ${JSON.stringify(gaps)},`,
        );
      }

      const stored = await this.ticketSyncService.create(
        results.map(
          (ticket) =>
            new TicketEntity({
              ...convertKeysToCamelCase(ticket),
              cache: new TicketCacheEntity(ticket),
            }),
        ),
      );

      if (order.upper instanceof ManifestEntity) {
        if (order.lower instanceof ManifestEntity) {
          // merge and close gap
          order.upper.lowerId = order.lower.lowerId;
          order.upper.startDate = order.lower.startDate;
          order.upper.completedStart = order.lower.completedStart;

          this.manifestService.save(order.upper);
          this.manifestService.delete(order.lower);
        } else {
          // extend upper downwards
          order.upper.lowerId = findLowestId(stored)?.id ?? order.upper.lowerId;
          order.upper.startDate = order.lower;
          order.upper.completedStart = true;

          this.manifestService.save(order.upper);
        }
      } else {
        if (order.lower instanceof ManifestEntity) {
          // extend lower upwards
          order.lower.upperId =
            findHighestId(stored)?.id ?? order.lower.upperId;
          order.lower.endDate = dayjs
            .min(dayjs(order.upper), currentDate)
            .toDate();
          order.lower.completedEnd = dayjs(order.lower.endDate).isBefore(
            currentDate,
          );

          this.manifestService.save(order.lower);
        } else {
          if (stored.length === 0) continue;

          // create new manifest
          order.upper = new ManifestEntity({
            type: ManifestType.tickets,
            lowerId: findLowestId(stored)!.id,
            upperId: findHighestId(stored)!.id,
            startDate: order.lower,
            completedStart: true,
            endDate: dayjs.min(dayjs(order.upper), currentDate).toDate(),
            completedEnd: dayjs(order.upper).isBefore(currentDate),
          });

          this.manifestService.save(order.upper);
        }
      }
    }

    await this.manifestService.mergeManifests(
      ManifestType.tickets,
      recentlyRange,
    );
  }

  async refreshIncomplete() {
    const incomplete = await this.ticketSyncService.findIncomplete(
      new FindIncompleteParams({
        // older than 4 minutes, to ignore the current run
        staleness: 1000 * 60 * 4,
      }),
    );

    this.logger.log(`Found ${incomplete.length} incomplete tickets`);

    const chunks = _.chunk(incomplete, 100);

    for (const chunk of chunks) {
      const result = await rateLimit(
        tickets(
          { 'search[id]': chunk.join(',') },
          this.axiosAuthService.getGlobalConfig(),
        ),
      );

      const completed = result.filter((ticket) => ticket.status === 'approved');
      if (completed.length > 0) {
        this.logger.log(`Found ${completed.length} newly completed tickets`);
      }

      await this.ticketSyncService.create(
        result.map(
          (ticket) =>
            new TicketEntity({
              ...convertKeysToCamelCase(ticket),
              cache: new TicketCacheEntity(ticket),
            }),
        ),
      );
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async onSync() {
    if (this.isRunning) {
      this.logger.warn('Task already running, skipping...');
      return;
    }

    this.logger.log('Running...');
    this._isRunning = true;

    try {
      await this.runOrders();
      await this.refreshIncomplete();
    } catch (error) {
      this.logger.error(
        `An error occurred while running ${TicketSyncWorker.name}`,
        error,
        error.stack,
      );
    } finally {
      this.logger.log('Finished');
      this._isRunning = false;
    }
  }
}
