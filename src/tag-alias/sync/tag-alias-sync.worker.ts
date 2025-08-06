import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetTagAliasesSearchOrder, TagAlias, tagAliases } from 'src/api';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import {
  DateRange,
  LoopGuard,
  PartialDateRange,
  convertKeysToCamelCase,
  findHighestDate,
  logContiguityGaps,
  logOrderFetch,
  logOrderResult,
  rateLimit,
  resolveWithDate,
} from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType, getItemName } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';

import { TagAliasEntity, TagAliasLabelEntity } from '../tag-alias.entity';
import { TagAliasSyncService } from './tag-alias-sync.service';

@Injectable()
export class TagAliasSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly tagAliasSyncService: TagAliasSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(TagAliasSyncWorker.name);
  private readonly type = ItemType.tagAliases;

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: `${getItemName(this.type)} Orders Sync`,
        key: `/${this.type}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();
          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            this.type,
            recentlyRange,
          );

          for (const order of orders) {
            const results: TagAlias[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();
              const { idRange, dateRange } = order;
              logOrderFetch(this.logger, this.type, order);

              const result = await rateLimit(
                tagAliases(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': idRange.toE621RangeString(),
                    'search[order]': GetTagAliasesSearchOrder.id_desc,
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.tagAliasSyncService.save(
                result.map(
                  (alias) =>
                    new TagAliasEntity({
                      ...convertKeysToCamelCase(alias),
                      label: new TagAliasLabelEntity(alias),
                    }),
                ),
              );

              logOrderResult(this.logger, this.type, stored);
              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: this.type,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                logContiguityGaps(this.logger, this.type, results);
                break;
              }
            }
          }
          await this.manifestService.mergeInRange(this.type, recentlyRange);
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runRefresh() {
    this.jobService.add(
      new Job({
        title: `${getItemName(this.type)} Refresh Sync`,
        key: `/${this.type}/refresh`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();
          const manifests = await this.manifestService.list(undefined, {
            type: [this.type],
          });

          for (const manifest of manifests) {
            let refreshDate = manifest.refreshedAt;
            if (!refreshDate) {
              refreshDate = (
                await this.tagAliasSyncService.firstFromId(manifest.lowerId)
              )?.updatedAt;
            }
            if (!refreshDate) continue;

            const results: TagAlias[] = [];
            const loopGuard = new LoopGuard();
            let page = 1;

            while (true) {
              cancelToken.ensureRunning();
              const rangeString = new PartialDateRange({
                startDate: refreshDate,
              }).toE621RangeString();
              const idString = manifest.idRange.toE621RangeString();

              this.logger.log(
                `Fetching tag aliases for refresh date ${rangeString} with ids ${idString}`,
              );

              const result = await rateLimit(
                tagAliases(
                  loopGuard.iter({
                    page,
                    limit: MAX_API_LIMIT,
                    'search[updated_at]': rangeString,
                    'search[id]': idString,
                    'search[order]': GetTagAliasesSearchOrder.id_desc,
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const updated = await this.tagAliasSyncService.countUpdated(
                result.map(convertKeysToCamelCase),
              );

              const stored = await this.tagAliasSyncService.save(
                result.map(
                  (alias) =>
                    new TagAliasEntity({
                      ...convertKeysToCamelCase(alias),
                      label: new TagAliasLabelEntity(alias),
                    }),
                ),
              );

              await this.manifestService.save({
                id: manifest.id,
                refreshedAt:
                  resolveWithDate(findHighestDate(stored)) ?? refreshDate,
              });

              this.logger.log(`Found ${updated} updated tag aliases`);
              const exhausted = result.length < MAX_API_LIMIT;
              if (exhausted) break;
              page++;
            }
          }
        },
      }),
    );
  }
}
