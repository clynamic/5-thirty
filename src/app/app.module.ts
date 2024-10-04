import '../utils/luxon';

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApprovalModule } from 'src/approval/approval.module';
import { AuthModule } from 'src/auth/auth.module';
import { CacheModule } from 'src/cache/cache.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';
import { DeletionModule } from 'src/deletion/deletion.module';
import { FeedbackModule } from 'src/feedback/feedback.module';
import { FlagModule } from 'src/flag/flag.module';
import { HealthModule } from 'src/health/health.module';
import { JobModule } from 'src/job/job.module';
import { ManifestModule } from 'src/manifest/manifest.module';
import { PostModule } from 'src/post/post.module';
import { TicketModule } from 'src/ticket/ticket.module';
import { UserModule } from 'src/user/user.module';

import { AppConfigModule } from './config.module';
import { CorsConfigModule } from './cors.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    CorsConfigModule,
    DatabaseModule,
    AuthModule,
    JobModule,
    HealthModule,
    DashboardModule,
    CacheModule,
    ManifestModule,
    ApprovalModule,
    TicketModule,
    UserModule,
    PostModule,
    FlagModule,
    DeletionModule,
    FeedbackModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
