import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AxiosInstance } from 'axios';
import { Request } from 'express';
import { AXIOS_INSTANCE } from 'src/api';
import { Readable } from 'stream';

@ApiTags('Proxy')
@Controller('proxy')
// TODO: This should have auth, to prevent abuse.
export class ProxyController {
  private readonly axios: AxiosInstance;
  private readonly STATIC_HOST = 'https://static1.e621.net';

  constructor() {
    this.axios = AXIOS_INSTANCE;
  }

  @Get('*')
  @ApiOperation({
    summary: 'Proxy request to static host',
    description:
      'Proxies a request to the static host and returns the file as a stream',
    operationId: 'proxyRequest',
  })
  @ApiResponse({
    status: 200,
    description: 'File streamed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid path',
  })
  async proxyRequest(
    @Query() queryParams: Record<string, string>,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const proxyPath = req.originalUrl.replace(/^\/proxy\//, '');

    if (!proxyPath || proxyPath.includes('://')) {
      throw new HttpException('Invalid path', HttpStatus.BAD_REQUEST);
    }

    const fullUrl = `${this.STATIC_HOST}/${proxyPath}`;

    const response = await this.axios.get(fullUrl, {
      params: queryParams,
      responseType: 'stream',
    });

    const stream = response.data as Readable;

    return new StreamableFile(stream, {
      type: response.headers['content-type'],
      disposition: `inline; filename="${proxyPath.split('/').pop()}"`,
    });
  }
}
