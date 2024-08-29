import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApprovalEntity } from '../approval.entity';

@Injectable()
export class ApprovalSyncService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
  ) {}

  create(value: ApprovalEntity): Promise<ApprovalEntity>;
  create(value: ApprovalEntity[]): Promise<ApprovalEntity[]>;

  async create(
    value: ApprovalEntity | ApprovalEntity[],
  ): Promise<ApprovalEntity | ApprovalEntity[]> {
    if (Array.isArray(value)) {
      return this.approvalRepository.save(value);
    }
    return this.approvalRepository.save(value);
  }
}
