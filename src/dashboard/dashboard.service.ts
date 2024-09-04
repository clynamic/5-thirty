import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DashboardUpdate } from './dashboard.dto';
import { DashboardEntity, DashboardType } from './dashboard.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DashboardEntity)
    private readonly dashboardRepository: Repository<DashboardEntity>,
  ) {}

  async get(
    userId: number,
    type: DashboardType,
  ): Promise<DashboardEntity | null> {
    return this.dashboardRepository.findOne({
      where: { userId, type },
    });
  }

  async update(
    userId: number,
    type: DashboardType,
    update: DashboardUpdate,
  ): Promise<DashboardEntity> {
    return await this.dashboardRepository.save({
      userId,
      type,
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
}
