import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from 'src/post/post.entity';

import { UserEntity } from '../user.entity';
import { UserHeadController } from './user-head.controller';
import { UserHeadService } from './user-head.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PostEntity])],
  controllers: [UserHeadController],
  providers: [UserHeadService],
  exports: [UserHeadService],
})
export class UserHeadModule {}
