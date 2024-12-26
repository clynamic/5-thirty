import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LabelEntity } from './label.entity';

@Injectable()
export class LabelService {
  constructor(
    @InjectRepository(LabelEntity)
    private readonly labelRepository: Repository<LabelEntity>,
  ) {}

  async get(id: string): Promise<LabelEntity> {
    return await this.labelRepository.findOneOrFail({
      where: { id },
    });
  }

  async save(id: string): Promise<string> {
    return (await this.labelRepository.save({ id })).id;
  }
}
