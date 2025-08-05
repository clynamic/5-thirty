import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEventAction } from 'src/api';
import { PostEntity } from 'src/post/post.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { In, Repository } from 'typeorm';
import { withInvalidation } from 'src/app/browser.module';

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
  ) {}

  save = withInvalidation(
    this.permitRepository.save.bind(this.permitRepository),
    PermitEntity,
  );

  remove = withInvalidation(
    this.permitRepository.remove.bind(this.permitRepository),
    PermitEntity,
  );

  delete = withInvalidation(
    this.permitRepository.delete.bind(this.permitRepository),
    PermitEntity,
  );

  savePosts = withInvalidation(
    this.postRepository.save.bind(this.postRepository),
    PostEntity,
  );

  /**
   * Unexplained posts are ones that are potentially in Pending status.
   *
   * To the aggregate, a Post is in Pending status when:
   * - It has not been approved
   * - It has not been deleted
   * - It has not been permitted
   */
  async findUnexplainedPosts(): Promise<UnexplainedPost[]> {
    return this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id', 'id')
      .addSelect('post_version.updater_id', 'uploaderId')
      .distinct(true)
      .leftJoin('permits', 'permit', 'post_version.post_id = permit.post_id')
      .leftJoin(
        'post_events',
        'event',
        'post_version.post_id = event.post_id AND event.action IN (:...excludeActions)',
        {
          excludeActions: [
            PostEventAction.approved,
            PostEventAction.unapproved,
            PostEventAction.deleted,
            PostEventAction.undeleted,
          ],
        },
      )
      .where('post_version.version = 1')
      .andWhere('permit.post_id IS NULL')
      .andWhere('event.post_id IS NULL')
      .getRawMany<{ id: number; uploaderId: number }>();
  }

  /**
   * Overexplained posts are ones that our server mistakenly marked as permitted.
   *
   * This can happen when a permit sync runs before an approval or deletion flag sync.
   */
  async findOverexplainedPosts(): Promise<number[]> {
    return this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.post_id', 'post_id')
      .distinct(true)
      .innerJoin('permits', 'permit', 'post_version.post_id = permit.post_id')
      .innerJoin(
        'post_events',
        'event',
        'post_version.post_id = event.post_id AND event.action IN (:...includeActions)',
        {
          includeActions: [PostEventAction.approved, PostEventAction.deleted],
        },
      )
      .where('post_version.version = 1')
      .getRawMany<{ post_id: number }>()
      .then((results) => results.map((result) => result.post_id));
  }

  /**
   * Removes permits associated with the given post IDs.
   */
  async removeFor(postIds: number): Promise<void>;

  /**
   * Removes permits associated with the given post ID.
   */
  async removeFor(postId: number[]): Promise<void>;

  async removeFor(postIds: number | number[]): Promise<void> {
    await this.delete({
      postId: In(Array.isArray(postIds) ? postIds : [postIds]),
    });
  }
}
