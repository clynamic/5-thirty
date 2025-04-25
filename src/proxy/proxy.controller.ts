import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AxiosInstance } from 'axios';
import { Request } from 'express';
import { AXIOS_INSTANCE } from 'src/api';
import { Readable } from 'stream';

@ApiTags('Proxy')
@Controller('proxy')
export class ProxyController {
  private readonly axios: AxiosInstance;
  private readonly STATIC_HOST = 'https://static1.e621.net';

  constructor() {
    this.axios = AXIOS_INSTANCE;
  }

  @Get('*')
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
