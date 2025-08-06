import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { withInvalidation } from 'src/app/browser.module';
import { DateRange } from 'src/common';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UploadSyncService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
  ) {}

  save = withInvalidation(
    this.postVersionRepository.save.bind(this.postVersionRepository),
    PostVersionEntity,
  );

  async findUploaders(range?: DateRange): Promise<number[]> {
    return (
      await this.postVersionRepository
        .createQueryBuilder('post_version')
        .select('post_version.updater_id', 'user_id')
        .addSelect('COUNT(post_version.id)', 'uploaded')
        .where(range ? { updatedAt: range?.find() } : {})
        .andWhere('post_version.version = 1')
        .groupBy('post_version.updater_id')
        .orderBy('uploaded', 'DESC')
        .take(100)
        .getRawMany<{
          user_id: string;
          uploaded: string;
        }>()
    ).map((row) => Number(row.user_id));
  }
}
