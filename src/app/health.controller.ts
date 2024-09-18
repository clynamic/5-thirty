import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor() {}

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check the health of the application',
    operationId: 'healthCheck',
  })
  @ApiResponse({
    status: 200,
    description: 'The application is healthy',
  })
  async healthCheck(): Promise<string> {
    return 'OK';
  }
}
