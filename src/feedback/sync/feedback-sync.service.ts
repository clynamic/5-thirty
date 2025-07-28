import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { withInvalidation } from 'src/app/browser.module';

import { FeedbackEntity } from '../feedback.entity';

@Injectable()
export class FeedbackSyncService {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
  ) {}

  save = withInvalidation(
    this.feedbackRepository.save.bind(this.feedbackRepository),
    FeedbackEntity,
  );
}
