import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { Approval, ApprovalQuery } from './approval.dto';

@ApiTags('Approvals')
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalsService: ApprovalService) {}

  /**
   * Get approval by ID
   * @param id the approval ID
   * @returns the approval
   */
  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Approval found',
    type: Approval,
  })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  async get(@Param('id') id: number): Promise<Approval | null> {
    return this.approvalsService.get(id);
  }

  /**
   * List approvals
   * @param query the query parameters
   * @returns a list of approvals
   */
  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of approvals',
    type: Approval,
    isArray: true,
  })
  async list(@Query() query: ApprovalQuery): Promise<Approval[]> {
    return this.approvalsService.list(query);
  }
}
