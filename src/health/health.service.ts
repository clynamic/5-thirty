import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { BulkUpdateRequestEntity } from 'src/bulk-update-request/bulk-update-request.entity';
import { WithId, PaginationParams, toRawQuery } from 'src/common';
import { FeedbackEntity } from 'src/feedback/feedback.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { ItemType } from 'src/label/label.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { ModActionEntity } from 'src/mod-action/mod-action.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TagAliasEntity } from 'src/tag-alias/tag-alias.entity';
import { TagImplicationEntity } from 'src/tag-implication/tag-implication.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { Between, Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import { ManifestHealth } from './health.dto';
import { generateManifestSlices } from './health.utils';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(PostReplacementEntity)
    private readonly postReplacementRepository: Repository<PostReplacementEntity>,
    @InjectRepository(ModActionEntity)
    private readonly modActionRepository: Repository<ModActionEntity>,
    @InjectRepository(BulkUpdateRequestEntity)
    private readonly bulkUpdateRequestRepository: Repository<BulkUpdateRequestEntity>,
    @InjectRepository(TagAliasEntity)
    private readonly tagAliasRepository: Repository<TagAliasEntity>,
    @InjectRepository(TagImplicationEntity)
    private readonly tagImplicationRepository: Repository<TagImplicationEntity>,
  ) {}

  private itemRepositories: Partial<Record<ItemType, Repository<WithId>>> = {
    [ItemType.tickets]: this.ticketRepository,
    [ItemType.approvals]: this.approvalRepository,
    [ItemType.flags]: this.flagRepository,
    [ItemType.feedbacks]: this.feedbackRepository,
    [ItemType.postVersions]: this.postVersionRepository,
    [ItemType.postReplacements]: this.postReplacementRepository,
    [ItemType.modActions]: this.modActionRepository,
    [ItemType.bulkUpdateRequests]: this.bulkUpdateRequestRepository,
    [ItemType.tagAliases]: this.tagAliasRepository,
    [ItemType.tagImplications]: this.tagImplicationRepository,
  };

  static getManifestHealthKey(pages?: PaginationParams): string {
    return `manifest-health?${toRawQuery(pages)}`;
  }

  @Cacheable(HealthService.getManifestHealthKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [
      ManifestEntity,
      ApprovalEntity,
      TicketEntity,
      FlagEntity,
      FeedbackEntity,
      PostVersionEntity,
      PostReplacementEntity,
      ModActionEntity,
      BulkUpdateRequestEntity,
      TagAliasEntity,
      TagImplicationEntity,
    ],
  })
  async getManifestHealth(pages?: PaginationParams): Promise<ManifestHealth[]> {
    const health: ManifestHealth[] = [];
    pages = new PaginationParams({
      limit: 5, // Ignore global default page size, as these items are very expensive to fetch
      ...pages,
    });

    const manifests = await this.manifestRepository.find({
      order: {
        endDate: 'DESC',
      },
      take: pages.limit,
      skip: PaginationParams.calculateOffset(pages),
    });

    for (const manifest of manifests) {
      const repository = this.itemRepositories[manifest.type];
      if (!repository) continue;

      const allIds: { id: number }[] = await repository.find({
        select: ['id'],
        where: {
          id: Between(manifest.lowerId, manifest.upperId),
        },
        order: {
          id: 'ASC',
        },
      });

      const slices = generateManifestSlices({
        allIds,
        lowerId: manifest.lowerId,
        upperId: manifest.upperId,
      });

      health.push(
        new ManifestHealth({
          id: manifest.id,
          type: manifest.type,
          startDate: manifest.startDate,
          endDate: manifest.endDate,
          startId: manifest.lowerId,
          endId: manifest.upperId,
          count: allIds.length,
          slices: slices,
        }),
      );
    }

    return health;
  }
}
