import '../utils/dayjs-extension';

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApprovalModule } from 'src/approval/approval.module';
import { AuthModule } from 'src/auth/auth.module';
import { CacheModule } from 'src/cache/cache.module';
import { JobModule } from 'src/job/job.module';
import { ManifestModule } from 'src/manifest/manifest.module';
import { TicketModule } from 'src/ticket/ticket.module';
import { UserModule } from 'src/user/user.module';

import { AppConfigModule } from './config.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    JobModule,
    CacheModule,
    ManifestModule,
    ApprovalModule,
    TicketModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
