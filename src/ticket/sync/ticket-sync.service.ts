import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateRange } from 'src/common';
import { In, MoreThanOrEqual, Repository } from 'typeorm';

import { TicketEntity } from '../ticket.entity';

@Injectable()
export class TicketSyncService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
  ) {}

  firstFromId(id: number) {
    return this.ticketRepository.findOne({
      where: {
        id: MoreThanOrEqual(id),
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async countUpdated(
    updated: Pick<TicketEntity, 'id' | 'updatedAt'>[],
  ): Promise<number> {
    const ids = updated.map((r) => r.id);
    const stored = await this.ticketRepository.findBy({
      id: In(ids),
    });

    const dbUpdatedAtMap = new Map(
      stored.map((r) => [r.id, r.updatedAt.toISOString()]),
    );

    let count = 0;
    for (const replacement of updated) {
      const dbUpdatedAt = dbUpdatedAtMap.get(replacement.id);
      if (dbUpdatedAt && dbUpdatedAt !== replacement.updatedAt.toISOString()) {
        count++;
      }
    }

    return count;
  }

  async findReporters(range?: DateRange): Promise<number[]> {
    return (
      await this.ticketRepository
        .createQueryBuilder('ticket')
        .select('ticket.creator_id', 'user_id')
        .addSelect('COUNT(ticket.id)', 'reported')
        .where(DateRange.fill(range).where())
        .groupBy('ticket.creator_id')
        .orderBy('reported', 'DESC')
        .take(100)
        .getRawMany<{
          user_id: string;
          reported: string;
        }>()
    ).map((row) => Number(row.user_id));
  }

  save = this.ticketRepository.save.bind(this.ticketRepository);
}
