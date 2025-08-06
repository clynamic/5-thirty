import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { withInvalidation } from 'src/app/browser.module';
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

  save = withInvalidation(
    this.bulkUpdateRequestRepository.save.bind(
      this.bulkUpdateRequestRepository,
    ),
    BulkUpdateRequestEntity,
  );
}
