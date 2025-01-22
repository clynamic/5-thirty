import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { Repository } from 'typeorm';

import { FlagEntity } from '../flag.entity';

@Injectable()
export class FlagSyncService {
  constructor(
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  firstFromId = constructFirstFromId(this.flagRepository);
  countUpdated = constructCountUpdated(this.flagRepository);

  save = this.flagRepository.save.bind(this.flagRepository);
}
