import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cacheable } from 'src/app/browser.module';
import { BulkUpdateRequestEntity } from 'src/bulk-update-request/bulk-update-request.entity';
import { PaginationParams, WithId } from 'src/common';
import { FeedbackEntity } from 'src/feedback/feedback.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { ItemType, POROUS_ITEM_TYPES } from 'src/label/label.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { ModActionEntity } from 'src/mod-action/mod-action.entity';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TagAliasEntity } from 'src/tag-alias/tag-alias.entity';
import { TagImplicationEntity } from 'src/tag-implication/tag-implication.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { Between, Repository } from 'typeorm';

import { ManifestHealth } from './manifest-health.dto';
import { generateManifestSlices } from './manifest-health.utils';

@Injectable()
export class ManifestHealthService {
  constructor(
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
    @InjectRepository(PostEventEntity)
    private readonly postEventRepository: Repository<PostEventEntity>,
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
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
  ) {}

  private itemRepositories: Partial<Record<ItemType, Repository<WithId>>> = {
    [ItemType.postEvents]: this.postEventRepository,
    [ItemType.tickets]: this.ticketRepository,
    [ItemType.flags]: this.flagRepository,
    [ItemType.feedbacks]: this.feedbackRepository,
    [ItemType.postVersions]: this.postVersionRepository,
    [ItemType.postReplacements]: this.postReplacementRepository,
    [ItemType.modActions]: this.modActionRepository,
    [ItemType.bulkUpdateRequests]: this.bulkUpdateRequestRepository,
    [ItemType.tagAliases]: this.tagAliasRepository,
    [ItemType.tagImplications]: this.tagImplicationRepository,
    [ItemType.permits]: this.permitRepository,
  };

  @Cacheable({
    prefix: 'manifest-health',
    ttl: 15 * 60 * 1000,
    dependencies: [
      ManifestEntity,
      PostEventEntity,
      TicketEntity,
      FlagEntity,
      FeedbackEntity,
      PostVersionEntity,
      PostReplacementEntity,
      ModActionEntity,
      BulkUpdateRequestEntity,
      TagAliasEntity,
      TagImplicationEntity,
      PermitEntity,
    ],
  })
  async manifests(pages?: PaginationParams): Promise<ManifestHealth[]> {
    const health: ManifestHealth[] = [];
    pages = new PaginationParams({
      limit: 5, // Ignore global default page size, as these items are very expensive to fetch
      ...pages,
    });

    const manifests = await this.manifestRepository.find({
      order: {
        endDate: 'DESC',
        id: 'DESC',
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
          porous: POROUS_ITEM_TYPES.includes(manifest.type),
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
