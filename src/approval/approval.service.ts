import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, LessThanOrEqual, Between, Repository } from 'typeorm';
import { ApprovalEntity } from './approval.entity';
import { ApprovalQuery } from './approval.dto';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
  ) {}

  async get(id: number): Promise<ApprovalEntity | null> {
    return this.approvalRepository.findOne({ where: { id } });
  }

  async list(query?: ApprovalQuery): Promise<ApprovalEntity[]> {
    return this.approvalRepository.find({
      where: query?.start
        ? query.end
          ? { createdAt: Between(query.start, query.end) }
          : { createdAt: MoreThanOrEqual(query.start) }
        : query?.end
          ? { createdAt: LessThanOrEqual(query.end) }
          : {},
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
