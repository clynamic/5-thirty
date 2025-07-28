import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { withInvalidation } from 'src/app/browser.module';

import { ModActionEntity } from '../mod-action.entity';

@Injectable()
export class ModActionSyncService {
  constructor(
    @InjectRepository(ModActionEntity)
    private readonly modActionRepository: Repository<ModActionEntity>,
  ) {}

  save = withInvalidation(
    this.modActionRepository.save.bind(this.modActionRepository),
    ModActionEntity,
  );
}
