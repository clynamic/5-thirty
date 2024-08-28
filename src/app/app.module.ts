import '../utils/dayjs-extension';

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApprovalModule } from 'src/approval';
import { AuthModule } from 'src/auth';
import { CacheModule } from 'src/cache';
import { ManifestModule } from 'src/manifest/manifest.module';
import { TicketModule } from 'src/ticket';

import { AppConfigModule } from './config.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    CacheModule,
    ManifestModule,
    ApprovalModule,
    TicketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
