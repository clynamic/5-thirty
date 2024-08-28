import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PartialDateRange } from 'src/utils';
import { Repository } from 'typeorm';

import { ApprovalEntity } from './approval.entity';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
  ) {}

  async get(id: number): Promise<ApprovalEntity | null> {
    return this.approvalRepository.findOne({ where: { id } });
  }

  async list(query?: PartialDateRange): Promise<ApprovalEntity[]> {
    return this.approvalRepository.find({
      where: {
        createdAt: query?.toFindOperator(),
      },
    });
  }

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
