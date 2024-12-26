import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { chunk } from 'lodash';
import { Ticket, tickets, TicketStatus } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import {
  convertKeysToCamelCase,
  DateRange,
  findContiguityGaps,
  findHighestDate,
  findHighestId,
  findLowestDate,
  findLowestId,
  getIdRangeString,
  LoopGuard,
  PartialDateRange,
  rateLimit,
} from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';
import {
  NotabilityType,
  NotableUserEntity,
} from 'src/user/notable-user.entity';
import { UserSyncService } from 'src/user/sync/user-sync.service';

import { TicketCacheEntity, TicketEntity } from '../ticket.entity';
import { FindIncompleteParams, TicketSyncService } from './ticket-sync.service';

@Injectable()
export class TicketSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly ticketSyncService: TicketSyncService,
    private readonly userSyncService: UserSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(TicketSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  runOrders() {
    this.jobService.add(
      new Job({
        title: 'Ticket Orders Sync',
        key: `/${ItemType.tickets}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.tickets,
            recentlyRange,
          );

          for (const order of orders) {
            const results: Ticket[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const dateRange = order.toDateRange();
              const lowerId = order.lowerId;
              const upperId = order.upperId;

              this.logger.log(
                `Fetching tickets for ${dateRange.toE621RangeString()} with ids ${getIdRangeString(
                  lowerId,
                  upperId,
                )}`,
              );

              const result = await rateLimit(
                tickets(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': getIdRangeString(lowerId, upperId),
                    'search[order]': 'id',
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.ticketSyncService.save(
                result.map(
                  (ticket) =>
                    new TicketEntity({
                      ...convertKeysToCamelCase(ticket),
                      cache: new TicketCacheEntity(ticket),
                    }),
                ),
              );

              this.logger.log(
                `Found ${result.length} tickets with ids ${
                  getIdRangeString(
                    findLowestId(result)?.id,
                    findHighestId(result)?.id,
                  ) || 'none'
                } and dates ${
                  new PartialDateRange({
                    startDate: findLowestDate(stored)?.createdAt,
                    endDate: findHighestDate(stored)?.createdAt,
                  }).toE621RangeString() || 'none'
                }`,
              );

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.tickets,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                const gaps = findContiguityGaps(results);
                if (gaps.length > 0) {
                  this.logger.warn(
                    `Found ${gaps.length} gaps in ID contiguity: ${JSON.stringify(gaps)},`,
                  );
                }
                break;
              }
            }
          }

          await this.manifestService.mergeInRange(
            ItemType.tickets,
            recentlyRange,
          );
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  refreshIncomplete() {
    this.jobService.add(
      new Job({
        title: 'Ticket Incomplete Sync',
        key: `/${ItemType.tickets}/incomplete`,
        execute: async ({ cancelToken }) => {
          const incomplete = await this.ticketSyncService.findIncomplete(
            new FindIncompleteParams({
              // older than 5 minutes, to ignore the current run
              staleness: 1000 * 60 * 5,
            }),
          );

          this.logger.log(`Found ${incomplete.length} incomplete tickets`);

          const chunks = chunk(incomplete, 100);
          const results: Ticket[] = [];

          for (const chunk of chunks) {
            cancelToken.ensureRunning();

            const result = await rateLimit(
              tickets(
                {
                  limit: 100,
                  'search[id]': chunk.join(','),
                },
                this.authService.getServerAxiosConfig(),
              ),
            );

            results.push(...result);

            await this.ticketSyncService.save(
              result.map(
                (ticket) =>
                  new TicketEntity({
                    ...convertKeysToCamelCase(ticket),
                    cache: new TicketCacheEntity(ticket),
                  }),
              ),
            );
          }

          const completed = results.filter(
            (ticket) => ticket.status === TicketStatus.approved,
          );

          this.logger.log(`Found ${completed.length} newly completed tickets`);
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  writeNotable() {
    this.jobService.add(
      new Job({
        title: 'Ticket Notable Sync',
        key: `/${ItemType.tickets}/notable`,
        execute: async () => {
          const reporters = await this.ticketSyncService.findReporters();

          await this.userSyncService.note(
            reporters.map(
              (reporter) =>
                new NotableUserEntity({
                  id: reporter,
                  type: NotabilityType.reporter,
                }),
            ),
          );

          this.logger.log(`Noted ${reporters.length} reporters`);
        },
      }),
    );
  }
}
