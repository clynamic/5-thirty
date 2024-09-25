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

  async get(id: number): Promise<ApprovalEntity | null> {
    return this.approvalRepository.findOneBy({ id });
  }

  save = this.approvalRepository.save.bind(this.approvalRepository);
}
