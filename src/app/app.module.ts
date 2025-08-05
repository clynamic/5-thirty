import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApprovalModule } from 'src/approval/approval.module';
import { AuthModule } from 'src/auth/auth.module';
import { BulkUpdateRequestModule } from 'src/bulk-update-request/bulk-update-request.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';
import { DeletionModule } from 'src/deletion/deletion.module';
import { FeedbackModule } from 'src/feedback/feedback.module';
import { FlagModule } from 'src/flag/flag.module';
import { HealthModule } from 'src/health/health.module';
import { JobModule } from 'src/job/job.module';
import { LabelModule } from 'src/label/label.module';
import { ManifestModule } from 'src/manifest/manifest.module';
import { ModActionModule } from 'src/mod-action/mod-action.module';
import { PerformanceModule } from 'src/performance/performance.module';
import { PermitModule } from 'src/permit/permit.module';
import { PostModule } from 'src/post/post.module';
import { PostEventModule } from 'src/post-event/post-event.module';
import { PostReplacementModule } from 'src/post-replacement/post-replacement.module';
import { PostVersionModule } from 'src/post-version/post-version.module';
import { ProxyModule } from 'src/proxy/proxy.module';
import { TagAliasModule } from 'src/tag-alias/tag-alias.module';
import { TagImplicationModule } from 'src/tag-implication/tag-implication.module';
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
    ProxyModule,
    JobModule,
    HealthModule,
    DashboardModule,
    LabelModule,
    ManifestModule,
    PerformanceModule,
    ApprovalModule,
    TicketModule,
    UserModule,
    PostModule,
    PostEventModule,
    FlagModule,
    DeletionModule,
    FeedbackModule,
    PostVersionModule,
    PostReplacementModule,
    UploadModule,
    PermitModule,
    ModActionModule,
    BulkUpdateRequestModule,
    TagAliasModule,
    TagImplicationModule,
  ],
})
export class AppModule {}
