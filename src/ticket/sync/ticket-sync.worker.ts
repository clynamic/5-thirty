import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Ticket, tickets } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import {
  DateRange,
  LoopGuard,
  PartialDateRange,
  convertKeysToCamelCase,
  logContiguityGaps,
  logOrderFetch,
  logOrderResult,
  rateLimit,
  resolveWithDate,
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

import { TicketEntity, TicketLabelEntity } from '../ticket.entity';
import { TicketSyncService } from './ticket-sync.service';

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

          for (let order of orders) {
            const results: Ticket[] = [];
            const loopGuard = new LoopGuard();
            const inPast = order.inPast;

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order;

              logOrderFetch(this.logger, ItemType.tickets, order);

              const result = await rateLimit(
                tickets(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': idRange.toE621RangeString(),
                    'search[order]': 'id',
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.ticketSyncService.save(
                result
                  // TODO: Tickets with a destroyed Resource return null creator IDs (malformed)
                  .filter((ticket) => ticket.creator_id != null)
                  .map(
                    (ticket) =>
                      new TicketEntity({
                        ...convertKeysToCamelCase(ticket),
                        label: new TicketLabelEntity(ticket),
                      }),
                  ),
              );

              logOrderResult(this.logger, ItemType.tickets, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              order = await this.manifestService.saveResults({
                type: ItemType.tickets,
                order,
                items: stored,
                bottom: exhausted,
                top: inPast,
              });

              if (exhausted) {
                logContiguityGaps(this.logger, ItemType.tickets, results);
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
  runRefresh() {
    this.jobService.add(
      new Job({
        title: 'Ticket Refresh Sync',
        key: `/${ItemType.tickets}/refresh`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const manifests = await this.manifestService.list(undefined, {
            type: [ItemType.tickets],
          });

          for (const manifest of manifests) {
            let refreshDate = manifest.refreshedAt;

            if (!refreshDate) {
              refreshDate = resolveWithDate(
                (await this.ticketSyncService.firstFromId(manifest.lowerId)) ??
                  undefined,
              );
            }

            if (!refreshDate) continue;

            const now = new Date();
            const loopGuard = new LoopGuard();
            let page = 1;

            while (true) {
              cancelToken.ensureRunning();

              const rangeString = new PartialDateRange({
                startDate: refreshDate,
              }).toE621RangeString();
              const idString = manifest.idRange.toE621RangeString();

              this.logger.log(
                `Fetching tickets for refresh date ${rangeString} with ids ${idString}`,
              );

              const result = await rateLimit(
                tickets(
                  loopGuard.iter({
                    page,
                    limit: MAX_API_LIMIT,
                    'search[updated_at]': rangeString,
                    'search[id]': idString,
                    'search[order]': 'id',
                  }),
                  axiosConfig,
                ),
              );

              const updated = await this.ticketSyncService.countUpdated(
                result
                  .filter((ticket) => ticket.id != null)
                  .map(convertKeysToCamelCase),
              );

              await this.ticketSyncService.save(
                result
                  .filter((ticket) => ticket.id != null)
                  .map(
                    (ticket) =>
                      new TicketEntity({
                        ...convertKeysToCamelCase(ticket),
                        label: new TicketLabelEntity(ticket),
                      }),
                  ),
              );

              this.logger.log(`Found ${updated} updated tickets`);

              const exhausted = result.length < MAX_API_LIMIT;

              if (exhausted) break;

              page++;
            }

            await this.manifestService.save({
              id: manifest.id,
              refreshedAt: now,
            });
          }
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
