import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UserCredentials } from './auth.dto';
import { ConfigService } from '@nestjs/config';
import { user } from 'src/api/e621';
import axios from 'axios';
import { encodeCredentials, readJwtSecret } from './auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private encryptCredentials(credentials: UserCredentials): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(readJwtSecret(this.configService), 'hex');

    if (key.length !== 32) {
      throw new Error(
        'Invalid key length. Key must be 32 bytes for aes-256-cbc.',
      );
    }

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptCredentials(encryptedCredentials: string): UserCredentials {
    const [ivHex, encrypted] = encryptedCredentials.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(readJwtSecret(this.configService)),
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return JSON.parse(decrypted);
  }

  async createToken(credentials: UserCredentials): Promise<string> {
    const encryptedCredentials = this.encryptCredentials(credentials);
    const payload = { encryptedCredentials };
    return this.jwtService.sign(payload, { expiresIn: '3d' });
  }

  async validateToken(token: string): Promise<UserCredentials> {
    const decoded = this.jwtService.verify(token);
    return this.decryptCredentials(decoded.encryptedCredentials);
  }

  async checkCredentials(credentials: UserCredentials): Promise<boolean> {
    try {
      await user(credentials.username, {
        headers: {
          Authorization: encodeCredentials(credentials),
        },
      });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return false;
      }
      throw error;
    }
  }
}
