import { TZDate } from '@date-fns/tz';
import { Injectable } from '@nestjs/common';
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

import { DailyActivity } from './activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    private readonly ticketMetricService: TicketMetricService,
    private readonly approvalMetricService: ApprovalMetricService,
    private readonly postReplacementMetricService: PostReplacementMetricService,
    private readonly deletionMetricService: DeletionMetricService,
  ) {}

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
    date: Date = TZDate.tz(SHIP_TIMEZONE),
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
