import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { Repository } from 'typeorm';

import { TagImplicationEntity } from '../tag-implication.entity';

@Injectable()
export class TagImplicationSyncService {
  constructor(
    @InjectRepository(TagImplicationEntity)
    private readonly TagImplicationRepository: Repository<TagImplicationEntity>,
  ) {}

  firstFromId = constructFirstFromId(this.TagImplicationRepository);
  countUpdated = constructCountUpdated(this.TagImplicationRepository);

  save = this.TagImplicationRepository.save.bind(this.TagImplicationRepository);
}
