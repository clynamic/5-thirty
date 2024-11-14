import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { ItemType } from 'src/cache/cache.entity';
import { WithId } from 'src/common';
import { FeedbackEntity } from 'src/feedback/feedback.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { Between, Repository } from 'typeorm';

import { ManifestHealth, ManifestSlice } from './health.dto';

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
  ) {}

  private itemRepositories: Partial<Record<ItemType, Repository<WithId>>> = {
    [ItemType.tickets]: this.ticketRepository,
    [ItemType.approvals]: this.approvalRepository,
    [ItemType.flags]: this.flagRepository,
    [ItemType.feedbacks]: this.feedbackRepository,
  };

  async getManifestHealth(): Promise<ManifestHealth[]> {
    const health: ManifestHealth[] = [];

    for (const itemType of Object.keys(this.itemRepositories) as ItemType[]) {
      const repository = this.itemRepositories[itemType];
      if (!repository) continue;

      const manifests = await this.manifestRepository.find({
        where: { type: itemType },
      });

      for (const manifest of manifests) {
        const allIds: { id: number }[] = await repository.find({
          select: ['id'],
          where: {
            id: Between(manifest.lowerId, manifest.upperId),
          },
          order: {
            id: 'ASC',
          },
        });

        const rangeSize = manifest.upperId - manifest.lowerId + 1;
        const maxIdsPerSlice = 10000;
        const rowCount = 30;
        const sliceCount =
          Math.ceil(Math.ceil(rangeSize / maxIdsPerSlice) / rowCount) *
          rowCount;
        const sliceSize = Math.ceil(rangeSize / sliceCount);

        const slices: ManifestSlice[] = [];

        let currentId = manifest.lowerId;
        let available = 0;
        let unavailable = 0;
        let none = 0;

        let idIndex = 0;

        for (let i = 0; i < sliceCount; i++) {
          const sliceStart = currentId;
          const sliceEnd = Math.min(
            currentId + sliceSize - 1,
            manifest.upperId,
          );

          available = 0;
          unavailable = 0;

          while (idIndex < allIds.length && allIds[idIndex]!.id <= sliceEnd) {
            while (currentId < allIds[idIndex]!.id) {
              unavailable++;
              currentId++;
            }

            available++;
            currentId++;
            idIndex++;
          }

          unavailable += Math.max(0, sliceEnd - currentId + 1);
          none = sliceSize - (available + unavailable);

          slices.push(
            new ManifestSlice({
              startId: sliceStart,
              endId: sliceEnd,
              available,
              unavailable,
              none,
            }),
          );

          currentId = sliceEnd + 1;
        }

        health.push(
          new ManifestHealth({
            id: manifest.id,
            type: itemType,
            startDate: manifest.startDate,
            endDate: manifest.endDate,
            startId: manifest.lowerId,
            endId: manifest.upperId,
            count: allIds.length,
            slices: slices,
          }),
        );
      }
    }

    return health;
  }
}
