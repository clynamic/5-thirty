import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FeedbackEntity } from '../feedback.entity';

@Injectable()
export class FeedbackSyncService {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
  ) {}

  save = this.feedbackRepository.save.bind(this.feedbackRepository);
}
