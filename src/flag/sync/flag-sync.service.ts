import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FlagEntity } from '../flag.entity';

@Injectable()
export class FlagSyncService {
  constructor(
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  save = this.flagRepository.save.bind(this.flagRepository);
}
