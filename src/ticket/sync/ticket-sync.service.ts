import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  constructCountUpdated,
  constructFirstFromId,
  DateRange,
} from 'src/common';
import { Repository } from 'typeorm';

import { TicketEntity } from '../ticket.entity';

@Injectable()
export class TicketSyncService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
  ) {}

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

  firstFromId = constructFirstFromId(this.ticketRepository);
  countUpdated = constructCountUpdated(this.ticketRepository);

  save = this.ticketRepository.save.bind(this.ticketRepository);
}
