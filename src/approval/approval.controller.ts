import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { Approval, ApprovalQuery } from './approval.dto';

@ApiTags('Approvals')
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalsService: ApprovalService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get approval',
    description: 'Get approval by ID',
    operationId: 'getApproval',
  })
  @ApiResponse({
    status: 200,
    description: 'Approval found',
    type: Approval,
  })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  async get(@Param('id') id: number): Promise<Approval | null> {
    return this.approvalsService.get(id);
  }

  @Get()
  @ApiOperation({
    summary: 'List approvals',
    description: 'List approvals with optional filtering',
    operationId: 'getApprovals',
  })
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
