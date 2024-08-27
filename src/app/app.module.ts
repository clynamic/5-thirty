import { Module } from '@nestjs/common';
import { ApprovalModule } from 'src/approval';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config.module';
import { DatabaseModule } from './database.module';
import { AuthModule } from 'src/auth';
import { ManifestModule } from 'src/manifest/manifest.module';
import { CacheModule } from 'src/cache';
import { TicketModule } from 'src/ticket';

import '../utils/dayjs-extension';

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
