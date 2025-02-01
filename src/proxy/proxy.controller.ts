import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AxiosError, AxiosInstance } from 'axios';
import { Request, Response } from 'express';
import { AXIOS_INSTANCE } from 'src/api';

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
    @Res() res: Response,
  ) {
    try {
      const proxyPath = req.originalUrl.replace(/^\/proxy\//, '');

      if (!proxyPath || proxyPath.includes('://')) {
        throw new HttpException('Invalid path', HttpStatus.BAD_REQUEST);
      }

      const fullUrl = `${this.STATIC_HOST}/${proxyPath}`;

      const response = await this.axios.get(fullUrl, {
        params: queryParams,
        responseType: 'stream',
      });

      res.set(response.headers);

      response.data.pipe(res);
    } catch (e) {
      const error = e as AxiosError;
      console.error('Failed to fetch resource', error);
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      } else {
        throw new HttpException(
          'Failed to fetch resource',
          HttpStatus.BAD_GATEWAY,
        );
      }
    }
  }
}
