import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketStatus } from 'src/api/e621';
import { PartialDateRange } from 'src/utils';
import { LessThan, Not, Repository } from 'typeorm';

import { TicketEntity } from '../ticket.entity';

export class FindIncompleteParams extends PartialDateRange {
  constructor(partial?: Partial<FindIncompleteParams>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Minimum age of the cached data in milliseconds.
   */
  staleness?: number;
}

@Injectable()
export class TicketSyncService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
  ) {}

  async findIncomplete(
    params?: FindIncompleteParams,
  ): Promise<TicketEntity['id'][]> {
    return this.ticketRepository
      .find({
        where: {
          createdAt: params?.toFindOperator(),
          status: Not(TicketStatus.approved),
          cache: params?.staleness
            ? {
                refreshedAt: LessThan(new Date(Date.now() - params.staleness)),
              }
            : undefined,
        },
        select: ['id'],
        relations: ['cache'],
      })
      .then((tickets) => tickets.map((ticket) => ticket.id));
  }

  create(value: TicketEntity): Promise<TicketEntity>;
  create(value: TicketEntity[]): Promise<TicketEntity[]>;

  async create(
    value: TicketEntity | TicketEntity[],
  ): Promise<TicketEntity | TicketEntity[]> {
    if (Array.isArray(value)) {
      return this.ticketRepository.save(value);
    }
    return this.ticketRepository.save(value);
  }
}
