import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { ItemType } from 'src/cache/cache.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { WithId } from 'src/common';
import { Between, Repository } from 'typeorm';

import { IdGap, ManifestCondition, ManifestHealth } from './health.dto';

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
  ) {}

  private itemRepositories: Partial<Record<ItemType, Repository<WithId>>> = {
    [ItemType.tickets]: this.ticketRepository,
    [ItemType.approvals]: this.approvalRepository,
    [ItemType.flags]: this.flagRepository,
  };

  async getManifestHealth(): Promise<ManifestHealth[]> {
    const health: ManifestHealth[] = [];

    for (const itemType of Object.keys(this.itemRepositories) as ItemType[]) {
      const repository = this.itemRepositories[itemType];
      if (!repository) continue;

      const manifests = await this.manifestRepository.find({
        where: {
          type: itemType,
        },
      });

      const totalCount = await repository.count();

      const allGaps: {
        id: number;
        next_id: number;
        gap: number;
      }[] = await repository.query(`
        WITH id_sequence AS (
          SELECT id, 
                 LEAD(id) OVER (ORDER BY id) AS next_id
          FROM approvals
        )
        SELECT id, 
               next_id, 
               (next_id - id) AS gap
        FROM id_sequence
        WHERE (next_id - id) > 1;
      `);

      for (const manifest of manifests) {
        const covered = await repository.count({
          where: {
            id: Between(manifest.lowerId, manifest.upperId),
          },
        });

        const gaps = allGaps.filter(
          (gap) =>
            gap.id >= manifest.lowerId && gap.next_id <= manifest.upperId,
        );

        let condition: ManifestCondition;

        if (gaps.every((gap) => gap.gap <= 3)) {
          condition = ManifestCondition.nominal;
        } else if (gaps.every((gap) => gap.gap <= 20)) {
          condition = ManifestCondition.degraded;
        } else {
          condition = ManifestCondition.abnormal;
        }

        health.push(
          new ManifestHealth({
            ...manifest,
            condition: condition,
            coverage: Math.round((covered / totalCount) * 1000) / 1000,
            gaps: gaps.map(
              (gap) =>
                new IdGap({
                  id: gap.id,
                  nextId: gap.next_id,
                  gap: gap.gap,
                }),
            ),
          }),
        );
      }
    }

    return health;
  }
}
