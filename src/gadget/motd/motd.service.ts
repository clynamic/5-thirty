import { TZDate, tz } from '@date-fns/tz';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronTime } from 'cron';
import { isSameDay, parseISO, startOfDay, subDays } from 'date-fns';
import * as fs from 'fs/promises';
import { join } from 'path';
import { Cacheable } from 'src/app/browser.module';
import { AppConfigKeys } from 'src/app/config.module';
import { SHIP_TIMEZONE, createSeededRandom, getDailySeed } from 'src/common';

import { Motd, MotdEntity, MotdTier, defaultMotd } from './motd.dto';

@Injectable()
export class MotdService {
  private scheduleCache = new Map<
    string,
    { result: boolean; timestamp: number }
  >();
  private readonly SCHEDULE_CACHE_TTL = 72 * 60 * 60 * 1000;

  constructor(private readonly config: ConfigService) {}

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
      const cron = new CronTime(schedule, SHIP_TIMEZONE);
      const prevDay = startOfDay(subDays(date, 1));
      const next = cron.getNextDateFrom(prevDay).toJSDate();
      const dateUTC = TZDate.tz('UTC', date);
      const result = isSameDay(dateUTC, next);

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
  async getMotd(date: Date = TZDate.tz(SHIP_TIMEZONE)): Promise<Motd> {
    const items = await this.getMotdItems();
    const message = this.selectMotd(items, date);
    console.log(`MOTD for ${date.toISOString().split('T')[0]}: ${message}`);
    return new Motd({
      message: message ?? defaultMotd,
    });
  }
}
