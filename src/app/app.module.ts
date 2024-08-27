import { Module } from '@nestjs/common';
import { ApprovalsModule } from 'src/approval';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config.module';
import { DatabaseModule } from './database.module';
import { AuthModule } from 'src/auth';
import { ManifestModule } from 'src/manifest/manifest.module';
import { CacheModule } from 'src/cache';
import { TicketModule } from 'src/ticket';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    CacheModule,
    ManifestModule,
    ApprovalsModule,
    TicketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
