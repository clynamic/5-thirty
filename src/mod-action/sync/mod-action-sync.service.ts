import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ModActionEntity } from '../mod-action.entity';

@Injectable()
export class ModActionSyncService {
  constructor(
    @InjectRepository(ModActionEntity)
    private readonly modActionRepository: Repository<ModActionEntity>,
  ) {}

  save = this.modActionRepository.save.bind(this.modActionRepository);
}
