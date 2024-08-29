import '../utils/dayjs-extension';

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApprovalModule } from 'src/approval';
import { AuthModule } from 'src/auth';
import { CacheModule } from 'src/cache';
import { JobModule } from 'src/job';
import { ManifestModule } from 'src/manifest';
import { TicketModule } from 'src/ticket';
import { UserModule } from 'src/user';

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
