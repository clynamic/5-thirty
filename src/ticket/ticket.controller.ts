import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { Ticket } from './ticket.dto';
import { TicketQuery } from './ticket.entity';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get ticket',
    description: 'Get ticket by ID',
    operationId: 'getTicket',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket found',
    type: Ticket,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async get(@Param('id') id: number): Promise<Ticket | null> {
    return this.ticketService.get(id);
  }

  @Get()
  @ApiOperation({
    summary: 'List tickets',
    description: 'List tickets with optional filtering',
    operationId: 'getTickets',
  })
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
