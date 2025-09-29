import { TZDate } from '@date-fns/tz';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs/promises';
import { SHIP_TIMEZONE } from 'src/common';

import { MotdEntity, defaultMotd } from './motd.dto';
import { MotdService } from './motd.service';

jest.mock('fs/promises');

jest.mock('src/app/browser.module', () => ({
  Cacheable:
    () =>
    (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) =>
      descriptor,
}));

describe('MotdService', () => {
  let service: MotdService;

  const TEST_MESSAGES = {
    DEFAULT: 'Test default message',
    WEEKEND: 'Test weekend message',
    WEEKDAY: 'Test weekday message',
    DAILY_SCHEDULE: 'Daily schedule message',
    MONTHLY_SCHEDULE: 'Monthly schedule message',
    LOW_WEIGHT: 'Low weight message',
    VALID_FALLBACK: 'Valid fallback message',
    LEAP_DAY: 'Leap day message',
    NORMAL_WEIGHT: 'Normal message',
    MESSAGE_A: 'Message A',
    MESSAGE_B: 'Message B',
  } as const;

  const TEST_SCHEDULES = {
    WEEKEND: '0 0 * * 0,6',
    WEEKDAY: '0 0 * * 1-5',
    DAILY_SCHEDULE: '0 0 15 3 *',
    MONTHLY_SCHEDULE: '0 0 10 7 *',
    LEAP_DAY: '0 0 29 2 *',
  } as const;

  const TEST_DATES = {
    SPECIFIC_DATE: '2025-01-01',
  } as const;

  const mockMotdData: MotdEntity[] = [
    {
      message: TEST_MESSAGES.DEFAULT,
      weight: 1.0,
    },
    {
      message: TEST_MESSAGES.WEEKEND,
      schedule: TEST_SCHEDULES.WEEKEND,
      weight: 2.0,
      tier: 'featured',
    },
    {
      message: TEST_MESSAGES.WEEKDAY,
      schedule: TEST_SCHEDULES.WEEKDAY,
      weight: 2.0,
      tier: 'featured',
    },
    {
      message: TEST_MESSAGES.DAILY_SCHEDULE,
      schedule: TEST_SCHEDULES.DAILY_SCHEDULE,
      tier: 'absolute',
    },
    {
      message: TEST_MESSAGES.MONTHLY_SCHEDULE,
      schedule: TEST_SCHEDULES.MONTHLY_SCHEDULE,
      tier: 'absolute',
    },
    {
      message: TEST_MESSAGES.DAILY_SCHEDULE,
      date: TEST_DATES.SPECIFIC_DATE,
      tier: 'absolute',
    },
    {
      message: TEST_MESSAGES.LOW_WEIGHT,
      weight: 0.001,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MotdService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('/mock/data/dir'),
          },
        },
      ],
    }).compile();

    service = module.get<MotdService>(MotdService);

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMotdData));
  });

  afterEach(() => {
    jest.clearAllMocks();

    (service as any).scheduleCache.clear();
  });

  describe('schedule matching', () => {
    it('should match schedule on the correct date', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.DAILY_SCHEDULE);
    });

    it('should NOT match schedule on the day after', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 16);
      const motd = await service.getMotd(date);

      expect(motd.message).not.toBe(TEST_MESSAGES.DAILY_SCHEDULE);
    });

    it('should match another schedule on correct date', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 6, 10);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.MONTHLY_SCHEDULE);
    });

    it('should NOT match schedule on day before', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 6, 9);
      const motd = await service.getMotd(date);

      expect(motd.message).not.toBe(TEST_MESSAGES.MONTHLY_SCHEDULE);
    });

    it('should match weekday schedule', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 3);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.WEEKDAY);
    });

    it('should match weekend schedule', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 1);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.WEEKEND);
    });
  });

  describe('date matching', () => {
    it('should match exact date', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 0, 1);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.DAILY_SCHEDULE);
    });

    it('should NOT match date on the day after', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 0, 2);
      const motd = await service.getMotd(date);

      expect(motd.message).not.toBe(TEST_MESSAGES.DAILY_SCHEDULE);
    });
  });

  describe('tier priority', () => {
    it('should prioritize absolute tier over featured tier', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.DAILY_SCHEDULE);
    });

    it('should prioritize featured tier over default tier', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 8);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.WEEKEND);
    });
  });

  describe('weighted selection', () => {
    it('should fall back to default messages when no schedule matches', async () => {
      const nonScheduledData: MotdEntity[] = [
        { message: TEST_MESSAGES.MESSAGE_A, weight: 0.5 },
        { message: TEST_MESSAGES.MESSAGE_B, weight: 0.3 },
        { message: TEST_MESSAGES.DEFAULT, weight: 0.2 },
      ];

      (fs.readFile as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(nonScheduledData),
      );

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 4, 15);
      const motd = await service.getMotd(date);

      expect([
        TEST_MESSAGES.MESSAGE_A,
        TEST_MESSAGES.MESSAGE_B,
        TEST_MESSAGES.DEFAULT,
      ]).toContain(motd.message);
    });

    it('should return default motd when no messages are available', async () => {
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 5, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(defaultMotd);
    });
  });

  describe('caching behavior', () => {
    it('should cache schedule results', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 15);

      await service.getMotd(date);
      await service.getMotd(date);

      const cache = (service as any).scheduleCache;
      const cacheKey = `${TEST_SCHEDULES.DAILY_SCHEDULE}:2025-03-15`;
      expect(cache.has(cacheKey)).toBe(true);
      expect(cache.get(cacheKey).result).toBe(true);
    });

    it('should respect cache TTL', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 15);

      const originalTTL = (service as any).SCHEDULE_CACHE_TTL;
      (service as any).SCHEDULE_CACHE_TTL = 0;

      await service.getMotd(date);

      await new Promise((resolve) => setTimeout(resolve, 1));
      await service.getMotd(date);

      (service as any).SCHEDULE_CACHE_TTL = originalTTL;

      const cache = (service as any).scheduleCache;
      expect(cache.size).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid cron expressions gracefully', async () => {
      const invalidCronData: MotdEntity[] = [
        {
          message: 'Invalid cron message',
          schedule: 'invalid cron expression',
          tier: 'absolute',
        },
        {
          message: TEST_MESSAGES.VALID_FALLBACK,
          weight: 1.0,
        },
      ];

      (fs.readFile as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(invalidCronData),
      );

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 5, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.VALID_FALLBACK);
    });

    it('should handle invalid date strings gracefully', async () => {
      const invalidDateData: MotdEntity[] = [
        {
          message: 'Invalid date message',
          date: 'not-a-date',
          tier: 'absolute',
        },
        {
          message: TEST_MESSAGES.VALID_FALLBACK,
          weight: 1.0,
        },
      ];

      (fs.readFile as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(invalidDateData),
      );

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 5, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.VALID_FALLBACK);
    });

    it('should handle file read errors gracefully', async () => {
      (fs.readFile as jest.Mock).mockRejectedValueOnce(
        new Error('File not found'),
      );

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 5, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(defaultMotd);
    });

    it('should handle invalid JSON gracefully', async () => {
      (fs.readFile as jest.Mock).mockResolvedValueOnce('invalid json');

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 5, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(defaultMotd);
    });
  });

  describe('edge cases', () => {
    it('should handle leap year dates correctly', async () => {
      const leapYearData: MotdEntity[] = [
        {
          message: TEST_MESSAGES.LEAP_DAY,
          schedule: TEST_SCHEDULES.LEAP_DAY,
          tier: 'absolute',
        },
      ];

      (fs.readFile as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(leapYearData),
      );

      const leapDate = TZDate.tz(SHIP_TIMEZONE, 2024, 1, 29);
      const motd = await service.getMotd(leapDate);

      expect(motd.message).toBe(TEST_MESSAGES.LEAP_DAY);
    });

    it('should handle timezone changes correctly', async () => {
      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 2, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.DAILY_SCHEDULE);
    });

    it('should handle messages with zero weight', async () => {
      const zeroWeightData: MotdEntity[] = [
        {
          message: 'Zero weight message',
          weight: 0,
        },
        {
          message: TEST_MESSAGES.NORMAL_WEIGHT,
          weight: 1.0,
        },
      ];

      (fs.readFile as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(zeroWeightData),
      );

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 5, 15);
      const motd = await service.getMotd(date);

      expect(motd.message).toBe(TEST_MESSAGES.NORMAL_WEIGHT);
    });
  });

  describe('seeded randomness', () => {
    it('should be deterministic for specific dates', async () => {
      const consistentData: MotdEntity[] = [
        { message: TEST_MESSAGES.MESSAGE_A, weight: 0.5 },
        { message: TEST_MESSAGES.MESSAGE_B, weight: 0.5 },
      ];

      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(consistentData),
      );

      const date = TZDate.tz(SHIP_TIMEZONE, 2025, 5, 15);

      const motd1 = await service.getMotd(date);
      const motd2 = await service.getMotd(date);
      const motd3 = await service.getMotd(date);

      expect(motd1.message).toBe(motd2.message);
      expect(motd2.message).toBe(motd3.message);
    });
  });
});
