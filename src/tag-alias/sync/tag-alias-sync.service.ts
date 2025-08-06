import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { withInvalidation } from 'src/app/browser.module';
import { constructCountUpdated, constructFirstFromId } from 'src/common';
import { Repository } from 'typeorm';

import { TagAliasEntity } from '../tag-alias.entity';

@Injectable()
export class TagAliasSyncService {
  constructor(
    @InjectRepository(TagAliasEntity)
    private readonly TagAliasRepository: Repository<TagAliasEntity>,
  ) {}

  firstFromId = constructFirstFromId(this.TagAliasRepository);
  countUpdated = constructCountUpdated(this.TagAliasRepository);

  save = withInvalidation(
    this.TagAliasRepository.save.bind(this.TagAliasRepository),
    TagAliasEntity,
  );
}
