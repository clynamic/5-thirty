import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { Ticket } from './ticket.dto';
import { TicketQuery } from './ticket.entity';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  /**
   * Get ticket by ID
   * @param id the ticket ID
   * @returns the ticket
   */
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Ticket found',
    type: Ticket,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async get(@Param('id') id: number): Promise<Ticket | null> {
    return this.ticketService.get(id);
  }

  /**
   * List tickets
   */
  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of tickets',
    type: Ticket,
    isArray: true,
  })
  async list(@Query() query?: TicketQuery): Promise<Ticket[]> {
    return this.ticketService.list(query);
  }
}
