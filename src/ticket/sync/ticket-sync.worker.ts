import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import _ from 'lodash';
import { Ticket, tickets, TicketStatus } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AxiosAuthService } from 'src/auth/axios-auth.service';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestType } from 'src/manifest/manifest.entity';
import { ManifestService } from 'src/manifest/manifest.service';
import {
  NotabilityType,
  NotableUserEntity,
} from 'src/user/sync/notable-user.entity';
import { UserSyncService } from 'src/user/sync/user-sync.service';
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
} from 'src/utils';

import { TicketCacheEntity, TicketEntity } from '../ticket.entity';
import { FindIncompleteParams, TicketSyncService } from './ticket-sync.service';

@Injectable()
export class TicketSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly axiosAuthService: AxiosAuthService,
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
        key: `/${ManifestType.tickets}/orders`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const recentlyRange = DateRange.recentMonths();

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
            const dateRange = order.toDateRange();

            this.logger.log(
              `Fetching tickets for ${dateRange.toE621RangeString()}`,
            );

            while (true) {
              cancelToken.ensureRunning();

              const result = await rateLimit(
                tickets(
                  loopGuard.iter({
                    page,
                    limit: MAX_API_LIMIT,
                    // tickets are *not* ordered properly.
                    // the site enforces special ordering that would be useful for humans, but not for us.
                    // because of that reason, we always need to exhaust the full date range
                    // before moving on and can't use the ID range to continously glide through the data.
                    'search[created_at]': dateRange.toE621RangeString(),
                  }),
                  axiosConfig,
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
                    startDate: findLowestDate(
                      result.map(convertKeysToCamelCase),
                    )?.createdAt,
                    endDate: findHighestDate(result.map(convertKeysToCamelCase))
                      ?.createdAt,
                  }).toE621RangeString() || 'none'
                }`,
              );

              if (result.length === 0) break;

              results = results.concat(result);
              page++;
            }

            if (results.length === 0) continue;

            const gaps = findContiguityGaps(results);
            if (gaps.length > 0) {
              this.logger.warn(
                `Found ${gaps.length} gaps in ID contiguity: ${JSON.stringify(gaps)},`,
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

            this.manifestService.saveResults({
              type: ManifestType.tickets,
              order,
              items: stored,
              exhausted: true,
            });
          }

          await this.manifestService.mergeInRange(
            ManifestType.tickets,
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
        key: `/${ManifestType.tickets}/incomplete`,
        execute: async ({ cancelToken }) => {
          const incomplete = await this.ticketSyncService.findIncomplete(
            new FindIncompleteParams({
              // older than 5 minutes, to ignore the current run
              staleness: 1000 * 60 * 5,
            }),
          );

          this.logger.log(`Found ${incomplete.length} incomplete tickets`);

          const chunks = _.chunk(incomplete, 100);
          const results: Ticket[] = [];

          for (const chunk of chunks) {
            cancelToken.ensureRunning();

            const result = await rateLimit(
              tickets(
                {
                  limit: 100,
                  'search[id]': chunk.join(','),
                },
                this.axiosAuthService.getGlobalConfig(),
              ),
            );

            results.push(...result);

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

          const completed = results.filter(
            (ticket) => ticket.status === TicketStatus.approved,
          );

          this.logger.log(`Found ${completed.length} newly completed tickets`);
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  writeNotable() {
    this.jobService.add(
      new Job({
        title: 'Ticket Notable Sync',
        key: `/${ManifestType.tickets}/notable`,
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
