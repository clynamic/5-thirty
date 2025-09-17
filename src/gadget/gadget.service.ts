import { TZDate, tz } from '@date-fns/tz';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronExpressionParser } from 'cron-parser';
import { isSameDay, parseISO } from 'date-fns';
import * as fs from 'fs/promises';
import { join } from 'path';
import { Cacheable } from 'src/app/browser.module';
import { AppConfigKeys } from 'src/app/config.module';
import { ApprovalMetricService } from 'src/approval/metric/approval-metric.service';
import {
  DateRange,
  SHIP_TIMEZONE,
  TimeScale,
  createSeededRandom,
  getDailySeed,
} from 'src/common';
import { DeletionMetricService } from 'src/deletion/metric/deletion-metric.service';
import { Activity } from 'src/performance/metric/performance-metric.dto';
import { PostReplacementMetricService } from 'src/post-replacement/metric/post-replacement-metric.service';
import { TicketMetricService } from 'src/ticket/metric/ticket-metric.service';

import {
  DailyActivity,
  Motd,
  MotdEntity,
  MotdTier,
  defaultMotd,
} from './gadget.dto';

@Injectable()
export class GadgetService {
  private scheduleCache = new Map<
    string,
    { result: boolean; timestamp: number }
  >();
  private readonly SCHEDULE_CACHE_TTL = 72 * 60 * 60 * 1000;

  constructor(
    private readonly config: ConfigService,
    private readonly ticketMetricService: TicketMetricService,
    private readonly approvalMetricService: ApprovalMetricService,
    private readonly postReplacementMetricService: PostReplacementMetricService,
    private readonly deletionMetricService: DeletionMetricService,
  ) {}
  private getDailyDate(): Date {
    return TZDate.tz(SHIP_TIMEZONE);
  }

  private isDateMatch(dateStr: string, date: Date): boolean {
    try {
      const targetDate = parseISO(dateStr, { in: tz(SHIP_TIMEZONE) });
      return isSameDay(date, targetDate);
    } catch {
      return false;
    }
  }

  private isScheduleMatch(schedule: string, date: Date): boolean {
    const cacheKey = `${schedule}:${date.toISOString().split('T')[0]}`;
    const cached = this.scheduleCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.SCHEDULE_CACHE_TTL) {
      return cached.result;
    }

    try {
      const interval = CronExpressionParser.parse(schedule, {
        currentDate: date,
        tz: SHIP_TIMEZONE,
      });

      const next = interval.next().toDate();
      const prev = interval.prev().toDate();

      const result = isSameDay(date, next) || isSameDay(date, prev);
      this.scheduleCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } catch {
      this.scheduleCache.set(cacheKey, {
        result: false,
        timestamp: Date.now(),
      });
      return false;
    }
  }

  @Cacheable({
    prefix: 'motd-items',
    ttl: 24 * 60 * 60 * 1000,
  })
  private async getMotdItems(): Promise<MotdEntity[]> {
    try {
      const dataPath = join(
        this.config.get<string>(AppConfigKeys.DATA_DIR)!,
        'motd.json',
      );
      const data = await fs.readFile(dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private isMotdEligible(item: MotdEntity, date: Date): boolean {
    if (item.date) return this.isDateMatch(item.date, date);
    if (item.schedule) return this.isScheduleMatch(item.schedule, date);
    return !item.date && !item.schedule;
  }

  private pickWeighted(
    random: () => number,
    items: Array<{ message: string; weight: number }>,
  ): string | undefined {
    if (items.length === 0) return;
    const total = items.reduce((s, e) => s + e.weight, 0);
    if (total <= 0) return;
    const roll = random() * total;
    let acc = 0;
    for (const it of items) {
      acc += it.weight;
      if (roll <= acc) return it.message;
    }
    return;
  }

  private selectMotd(items: MotdEntity[], date: Date): string | undefined {
    if (items.length === 0) return;

    const seed = getDailySeed(date);
    const random = createSeededRandom(seed);

    const eligible = items.filter((item) => this.isMotdEligible(item, date));
    if (eligible.length === 0) return;

    const byTier = new Map<MotdTier, MotdEntity[]>();
    for (const e of eligible) {
      const tier = e.tier ?? 'default';
      const arr = byTier.get(tier) ?? [];
      arr.push(e);
      byTier.set(tier, arr);
    }

    const tierOrder: MotdTier[] = ['absolute', 'featured', 'default'];
    let arena: MotdEntity[] | undefined;
    for (const t of tierOrder) {
      const arr = byTier.get(t);
      if (arr && arr.length > 0) {
        arena = arr;
        break;
      }
    }
    if (!arena || arena.length === 0) return;

    const weighted = arena.map((it) => ({
      message: it.message,
      weight: it.weight ?? 1.0,
    }));

    return this.pickWeighted(random, weighted);
  }

  @Cacheable({
    prefix: 'motd-daily',
    ttl: 6 * 60 * 60 * 1000,
  })
  async getMotd(date: Date = this.getDailyDate()): Promise<Motd> {
    const items = await this.getMotdItems();
    const message = this.selectMotd(items, date);
    return new Motd({
      message: message ?? defaultMotd,
    });
  }

  private selectDailyActivity(date: Date): Activity {
    const options = [
      { activity: Activity.TicketHandle, weight: 40 },
      { activity: Activity.PostApprove, weight: 40 },
      { activity: Activity.PostReplacementApprove, weight: 10 },
      { activity: Activity.PostDelete, weight: 10 },
    ];

    const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
    const random = createSeededRandom(getDailySeed(date));
    const roll = random() * totalWeight;

    let weight = 0;
    for (const option of options) {
      weight += option.weight;
      if (roll <= weight) {
        return option.activity;
      }
    }

    return options[0]!.activity;
  }

  async getDailyActivity(
    date: Date = this.getDailyDate(),
  ): Promise<DailyActivity> {
    const activity = this.selectDailyActivity(date);

    const now = TZDate.tz(SHIP_TIMEZONE);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weekRange = new DateRange({
      startDate: startOfWeek,
      endDate: endOfWeek,
      timezone: SHIP_TIMEZONE,
      scale: TimeScale.All,
    });

    let value = 0;

    switch (activity) {
      case Activity.TicketHandle:
        const ticketStatus = await this.ticketMetricService.status(weekRange);
        value = ticketStatus.reduce(
          (sum, point) => sum + point.approved + point.partial,
          0,
        );
        break;

      case Activity.PostApprove:
        const approvals =
          await this.approvalMetricService.countSeries(weekRange);
        value = approvals.reduce((sum, point) => sum + point.value, 0);
        break;

      case Activity.PostReplacementApprove:
        const replacements =
          await this.postReplacementMetricService.status(weekRange);
        value = replacements.reduce(
          (sum, point) =>
            sum + point.approved + point.promoted + point.rejected,
          0,
        );
        break;

      case Activity.PostDelete:
        const deletions =
          await this.deletionMetricService.countSeries(weekRange);
        value = deletions.reduce((sum, point) => sum + point.value, 0);
        break;
    }

    return new DailyActivity({
      value,
      timescale: TimeScale.Week,
      activity: activity,
    });
  }
}
