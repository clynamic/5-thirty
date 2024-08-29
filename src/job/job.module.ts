import { Global, Module } from '@nestjs/common';

import { JobService } from './job.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
