import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { TicketEntity, TicketQuery } from './ticket.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
  ) {}

  async get(id: number): Promise<TicketEntity | null> {
    return this.ticketRepository.findOne({ where: { id } });
  }

  async list(query?: TicketQuery): Promise<TicketEntity[]> {
    return this.ticketRepository.find({
      where: query?.start
        ? query.end
          ? { createdAt: Between(query.start, query.end) }
          : { createdAt: MoreThanOrEqual(query.start) }
        : query?.end
          ? { createdAt: LessThanOrEqual(query.end) }
          : {},
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
