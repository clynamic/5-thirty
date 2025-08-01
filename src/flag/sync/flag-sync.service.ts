import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { Repository } from 'typeorm';
import { withInvalidation } from 'src/app/browser.module';

import { FlagEntity } from '../flag.entity';

@Injectable()
export class FlagSyncService {
  constructor(
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  firstFromId = constructFirstFromId(this.flagRepository);
  countUpdated = constructCountUpdated(this.flagRepository);

  save = withInvalidation(
    this.flagRepository.save.bind(this.flagRepository),
    FlagEntity,
  );
}
