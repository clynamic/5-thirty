import '../common/luxon';

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
import { PermitModule } from 'src/permit/permit.module';
import { PostModule } from 'src/post/post.module';
import { PostVersionModule } from 'src/post_version/post_version.module';
import { TicketModule } from 'src/ticket/ticket.module';
import { UploadModule } from 'src/upload/upload.module';
import { UserModule } from 'src/user/user.module';

import { BrowserModule } from './browser.module';
import { AppConfigModule } from './config.module';
import { CorsConfigModule } from './cors.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    BrowserModule,
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
    PostVersionModule,
    UploadModule,
    PermitModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
