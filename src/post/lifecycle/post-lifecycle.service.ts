import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invalidates } from 'src/app/browser.module';
import { Repository } from 'typeorm';

import { PostLifecycleEntity } from './post-lifecycle.entity';

export interface LifecycleUploadData {
  postId: number;
  uploadedAt: Date;
}

export interface LifecycleApprovalData {
  postId: number;
  approvedAt: Date | null;
}

export interface LifecycleDeletionData {
  postId: number;
  deletedAt: Date | null;
}

export interface LifecyclePermitData {
  postId: number;
  permittedAt: Date;
}

@Injectable()
export class PostLifecycleService {
  constructor(
    @InjectRepository(PostLifecycleEntity)
    private readonly lifecycleRepository: Repository<PostLifecycleEntity>,
  ) {}

  @Invalidates(PostLifecycleEntity)
  async upsertUploads(data: LifecycleUploadData[]): Promise<void> {
    if (data.length === 0) return;

    await this.lifecycleRepository
      .createQueryBuilder()
      .insert()
      .into(PostLifecycleEntity)
      .values(
        data.map((d) => ({
          postId: d.postId,
          uploadedAt: d.uploadedAt,
        })),
      )
      .orUpdate(['uploaded_at', 'updated_at'], ['post_id'])
      .execute();
  }

  @Invalidates(PostLifecycleEntity)
  async upsertApprovals(data: LifecycleApprovalData[]): Promise<void> {
    if (data.length === 0) return;

    await this.lifecycleRepository
      .createQueryBuilder()
      .insert()
      .into(PostLifecycleEntity)
      .values(
        data.map((d) => ({
          postId: d.postId,
          approvedAt: d.approvedAt,
        })),
      )
      .orUpdate(['approved_at', 'updated_at'], ['post_id'])
      .execute();
  }

  @Invalidates(PostLifecycleEntity)
  async upsertDeletions(data: LifecycleDeletionData[]): Promise<void> {
    if (data.length === 0) return;

    await this.lifecycleRepository
      .createQueryBuilder()
      .insert()
      .into(PostLifecycleEntity)
      .values(
        data.map((d) => ({
          postId: d.postId,
          deletedAt: d.deletedAt,
        })),
      )
      .orUpdate(['deleted_at', 'updated_at'], ['post_id'])
      .execute();
  }

  @Invalidates(PostLifecycleEntity)
  async upsertPermits(data: LifecyclePermitData[]): Promise<void> {
    if (data.length === 0) return;

    await this.lifecycleRepository
      .createQueryBuilder()
      .insert()
      .into(PostLifecycleEntity)
      .values(
        data.map((d) => ({
          postId: d.postId,
          permittedAt: d.permittedAt,
        })),
      )
      .orUpdate(['permitted_at', 'updated_at'], ['post_id'])
      .execute();
  }

  @Invalidates(PostLifecycleEntity)
  async wipe(): Promise<void> {
    await this.lifecycleRepository.clear();
  }
}
