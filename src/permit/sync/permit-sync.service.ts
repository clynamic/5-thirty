import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostFlagType } from 'src/api';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { PostEntity } from 'src/post/post.entity';
import { PostVersionEntity } from 'src/post_version/post_version.entity';
import { Repository } from 'typeorm';

import { PermitEntity } from '../permit.entity';

export interface UnexplainedPost {
  id: number;
  uploaderId: number;
}

@Injectable()
export class PermitSyncService {
  constructor(
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  save = this.permitRepository.save.bind(this.permitRepository);

  remove = this.permitRepository.remove.bind(this.permitRepository);

  savePosts = this.postRepository.save.bind(this.postRepository);

  /**
   * Unexplained posts are ones that are potentially in Pending status.
   *
   * To the aggregate, a Post is in Pending status when:
   * - It has no Approval
   * - It has no Delete Flag
   * - It has no Permit
   */
  async findUnexplainedPosts(): Promise<UnexplainedPost[]> {
    // At the time of writng, we try to avoid pulling large amounts of Post objects from upstream.
    // Because of that, we only have the PostVersions available. They help us find the Post IDs.
    return this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id')
      .addSelect('post_version.updater_id')
      .distinct(true)
      .leftJoin(
        this.approvalRepository.metadata.tableName,
        'approval',
        'post_version.post_id = approval.post_id',
      )
      .leftJoin(
        this.flagRepository.metadata.tableName,
        'flag',
        'post_version.post_id = flag.post_id AND flag.type = :deletionType',
        { deletionType: PostFlagType.deletion },
      )
      .leftJoin('permits', 'permit', 'post_version.post_id = permit.post_id')
      .where('post_version.version = 1') // source Post IDs from the first version.
      .andWhere('approval.post_id IS NULL') // No associated approval.
      .andWhere('flag.id IS NULL') // No associated deletion flag.
      .andWhere('permit.post_id IS NULL') // No associated permit.
      .getRawMany()
      .then((results) =>
        results.map((result) => ({
          id: result.post_id,
          uploaderId: result.updater_id,
        })),
      );
  }
}
