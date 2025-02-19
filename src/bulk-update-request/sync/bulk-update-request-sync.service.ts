import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { Repository } from 'typeorm';

import { BulkUpdateRequestEntity } from '../bulk-update-request.entity';

@Injectable()
export class BulkUpdateRequestSyncService {
  constructor(
    @InjectRepository(BulkUpdateRequestEntity)
    private readonly bulkUpdateRequestRepository: Repository<BulkUpdateRequestEntity>,
  ) {}

  firstFromId = constructFirstFromId(this.bulkUpdateRequestRepository);
  countUpdated = constructCountUpdated(this.bulkUpdateRequestRepository);

  save = this.bulkUpdateRequestRepository.save.bind(
    this.bulkUpdateRequestRepository,
  );
}
