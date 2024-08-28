import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity } from './ticket.entity';
import { PartialDateRange } from 'src/utils';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
  ) {}

  async get(id: number): Promise<TicketEntity | null> {
    return this.ticketRepository.findOne({ where: { id } });
  }

  async list(query?: PartialDateRange): Promise<TicketEntity[]> {
    return this.ticketRepository.find({
      where: {
        createdAt: query?.toFindOperator(),
      },
    });
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
