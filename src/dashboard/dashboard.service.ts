import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cacheable, Invalidates } from 'src/app/browser.module';

import { DashboardUpdate } from './dashboard.dto';
import { DashboardEntity, DashboardType } from './dashboard.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DashboardEntity)
    private readonly dashboardRepository: Repository<DashboardEntity>,
  ) {}

  @Cacheable({
    prefix: 'dashboard',
    ttl: 30 * 60 * 1000,
    dependencies: [DashboardEntity],
  })
  async get(
    userId: number,
    type: DashboardType,
  ): Promise<DashboardEntity | null> {
    return this.dashboardRepository.findOne({
      where: { userId, type },
    });
  }

  @Invalidates(DashboardEntity)
  async update(
    userId: number,
    type: DashboardType,
    update: DashboardUpdate,
  ): Promise<DashboardEntity> {
    return this.dashboardRepository.save({
      userId,
      type,
      version: 1,
      positions: {
        xs: [],
        sm: [],
        md: [],
        lg: [],
        xl: [],
      },
      meta: {},
      ...update,
    });
  }

  @Invalidates(DashboardEntity)
  async delete(userId: number, type: DashboardType): Promise<void> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { userId, type },
    });
    if (dashboard) {
      await this.dashboardRepository.remove(dashboard);
    }
  }
}
