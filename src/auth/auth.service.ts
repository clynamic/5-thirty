import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as crypto from 'crypto';
import { User, user } from 'src/api/e621';

import { UserCredentials } from './auth.dto';
import { encodeCredentials, readJwtSecret } from './auth.utils';

export interface EncodedJwt {
  credentials: string;
  username: string;
  level: string;
}

export interface DecodedJwt {
  credentials: UserCredentials;
  username: string;
  level: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  encryptCredentials(credentials: UserCredentials): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(readJwtSecret(this.configService), 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptCredentials(encryptedCredentials: string): UserCredentials {
    const [ivHex, encrypted] = encryptedCredentials.split(':');
    const iv = Buffer.from(ivHex!, 'hex');
    const key = Buffer.from(readJwtSecret(this.configService), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted!, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return JSON.parse(decrypted);
  }

  async createToken(credentials: UserCredentials, user: User): Promise<string> {
    const encryptedCredentials = this.encryptCredentials(credentials);
    const payload: EncodedJwt = {
      credentials: encryptedCredentials,
      username: user.name,
      level: user.level_string,
    };
    return this.jwtService.sign(payload, { expiresIn: '3d' });
  }

  async validateToken(token: string): Promise<DecodedJwt> {
    const decoded = this.jwtService.verify(token);
    return {
      credentials: this.decryptCredentials(decoded.credentials),
      username: decoded.username,
      level: decoded.level,
    };
  }

  async getUserForCredentials(
    credentials: UserCredentials,
  ): Promise<User | undefined> {
    try {
      return await user(credentials.username, {
        headers: {
          Authorization: encodeCredentials(credentials),
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return undefined;
        }
      }
      throw error;
    }
  }
}
