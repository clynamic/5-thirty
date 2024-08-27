import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketService } from './ticket.service';
import { ManifestEntity, ManifestService } from 'src/manifest';
import {
  convertKeysToCamelCase,
  findHighestDate,
  findHighestId,
  findLowestDate,
  findLowestId,
  getCurrentMonthRange,
  getDateRangeString,
  getRangeString,
  rateLimit,
} from 'src/utils';
import { Ticket, tickets } from 'src/api/e621';
import { ConfigService } from '@nestjs/config';
import { AppConfigKeys } from 'src/app/config.module';
import { encodeCredentials } from 'src/auth/auth.utils';
import { UserCredentials } from 'src/auth';
import { TicketEntity } from './ticket.entity';
import { CacheEntity } from 'src/cache';

@Injectable()
export class TicketWorker {
  constructor(
    private readonly configService: ConfigService,
    private readonly ticketService: TicketService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(TicketWorker.name);
  private isRunning = false;

  private manifestType = 'tickets';

  @Cron(CronExpression.EVERY_5_MINUTES)
  async onSync() {
    if (this.isRunning) {
      this.logger.warn('Task already running, skipping...');
      return;
    }

    this.logger.log('TicketWorker is running');
    this.isRunning = true;

    try {
      const credentials: UserCredentials = {
        username: this.configService.get<string>(
          AppConfigKeys.E621_GLOBAL_USERNAME,
        ),
        password: this.configService.get<string>(
          AppConfigKeys.E621_GLOBAL_API_KEY,
        ),
      };

      const currentMonthRange = getCurrentMonthRange();

      const manifests = await this.manifestService.listByRange(
        this.manifestType,
        currentMonthRange,
      );

      this.logger.log(
        `Found ${manifests.length} manifests: ${JSON.stringify(manifests)}`,
      );

      const orders = ManifestService.splitLongOrders(
        await this.manifestService.listOrdersByRange(
          this.manifestType,
          currentMonthRange,
        ),
        14,
      );

      this.logger.log(
        `Found ${orders.length} orders: ${JSON.stringify(orders)}`,
      );

      if (1 === 1) return;

      for (const order of orders) {
        const limit = 320;
        let page = 1;

        let results: Ticket[] = [];

        while (true) {
          const dateRange = {
            start: ManifestService.getBoundaryDate(order.lower, 'end'),
            end: ManifestService.getBoundaryDate(order.upper, 'start'),
          };

          this.logger.log(
            `Fetching tickets for ${getDateRangeString(dateRange)}`,
          );

          const result = await rateLimit(
            tickets(
              {
                page,
                limit,
                'search[created_at]': getDateRangeString(dateRange),
                // 'search[id]': getRangeString(lowerId, upperId),
              },
              {
                headers: {
                  Authorization: encodeCredentials(credentials),
                },
              },
            ),
          );

          this.logger.log(
            `Found ${result.length} tickets with id range ${getRangeString(
              findLowestId(result)?.id,
              findHighestId(result)?.id,
            )} for ${getDateRangeString(dateRange)}`,
          );

          if (result.length === 0) break;

          results = results.concat(result);
          page += 1;
        }

        if (results.length === 0) continue;

        const stored = await this.ticketService.create(
          results.map(
            (ticket) =>
              new TicketEntity({
                ...convertKeysToCamelCase(ticket),
                cache: new CacheEntity({
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
            order.upper.lowerId = findLowestId(stored).id;
            order.upper.startDate = order.lower;
            order.upper.completedStart = true;

            this.manifestService.save(order.upper);
          }
        } else {
          if (order.lower instanceof ManifestEntity) {
            // extend lower upwards
            order.lower.upperId = findHighestId(stored).id;
            order.lower.endDate = order.upper;
            order.lower.completedEnd = true;

            this.manifestService.save(order.lower);
          } else {
            // create new manifest
            order.upper = new ManifestEntity({
              type: this.manifestType,
              lowerId: findLowestId(stored).id,
              upperId: findHighestId(stored).id,
              startDate: findLowestDate(stored).createdAt,
              endDate: findHighestDate(stored).createdAt,
              completedEnd: true,
            });

            this.manifestService.save(order.upper);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `An error occurred while running ${TicketWorker.name}`,
        error,
        error.stack,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
