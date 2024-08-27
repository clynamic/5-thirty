import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketService } from './ticket.service';
import { ManifestEntity, ManifestService } from 'src/manifest';
import {
  findContiguityGaps,
  convertKeysToCamelCase,
  findHighestId,
  findLowestId,
  LoopGuard,
  getDateRangeString,
  getIdRangeString,
  rateLimit,
  getTwoMonthsRange,
} from 'src/utils';
import { Ticket, tickets } from 'src/api/e621';
import { AxiosAuthService } from 'src/auth';
import { TicketEntity } from './ticket.entity';
import { CacheEntity } from 'src/cache';
import dayjs from 'dayjs';

@Injectable()
export class TicketWorker {
  constructor(
    private readonly axiosAuthService: AxiosAuthService,
    private readonly ticketService: TicketService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(TicketWorker.name);
  private isRunning = false;

  private itemType = 'tickets';

  @Cron(CronExpression.EVERY_5_MINUTES)
  async onSync() {
    if (this.isRunning) {
      this.logger.warn('Task already running, skipping...');
      return;
    }

    this.logger.log('Running...');
    this.isRunning = true;

    try {
      const axiosConfig = this.axiosAuthService.getGlobalConfig();

      const recentlyRange = getTwoMonthsRange();
      const currentDate = dayjs().utc().startOf('hour');

      const orders = ManifestService.splitLongOrders(
        await this.manifestService.listOrdersByRange(
          this.itemType,
          recentlyRange,
        ),
        14,
      );

      for (const order of orders) {
        let page = 1;
        let results: Ticket[] = [];

        const loopGuard = new LoopGuard();

        const dateRange = {
          start: ManifestService.getBoundaryDate(order.lower, 'end'),
          end: ManifestService.getBoundaryDate(order.upper, 'start'),
        };

        this.logger.log(
          `Fetching tickets for ${getDateRangeString(dateRange)}`,
        );

        while (true) {
          const result = await rateLimit(
            tickets(
              loopGuard.iter({
                page,
                limit: 320,
                'search[created_at]': getDateRangeString(dateRange),
              }),
              axiosConfig,
            ),
          );

          if (result.length === 0) break;

          this.logger.log(
            `Found ${result.length} tickets with id range ${getIdRangeString(
              findLowestId(result)?.id,
              findHighestId(result)?.id,
            )} for ${getDateRangeString(dateRange)}`,
          );

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

        const stored = await this.ticketService.create(
          results.map(
            (ticket) =>
              new TicketEntity({
                ...convertKeysToCamelCase(ticket),
                cache: new CacheEntity({
                  id: `/${this.itemType}/${ticket.id}`,
                  value: ticket,
                }),
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
            order.upper.lowerId =
              findLowestId(stored)?.id ?? order.upper.lowerId;
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
              type: this.itemType,
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

      await this.manifestService.mergeManifests(this.itemType, recentlyRange);
    } catch (error) {
      this.logger.error(
        `An error occurred while running ${TicketWorker.name}`,
        error,
        error.stack,
      );
    } finally {
      this.logger.log('Finished');
      this.isRunning = false;
    }
  }
}