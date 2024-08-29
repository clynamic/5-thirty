import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import fs from 'fs';
import { AppConfigKeys } from 'src/app';

import { UserCredentials } from './auth.dto';

export const readJwtSecret = (config: ConfigService) => {
  const file =
    config.get<string>(AppConfigKeys.JWT_SECRET_FILE) || '.jwt-secret';
  let secret = '';

  try {
    secret = fs.readFileSync(file, 'utf-8');
    if (!secret || secret.length !== 64) {
      throw new Error('Invalid secret');
    }
  } catch {
    secret = randomBytes(32).toString('hex');
    fs.writeFileSync(file, secret);
  }

  return secret;
};

export const encodeCredentials = (credentials: UserCredentials) => {
  return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
};

export const decodeCredentials = (credentials: string) => {
  const match = credentials.match(/^Basic (.+)$/);
  if (!match) {
    throw new Error('Invalid credentials');
  }
  const decoded = atob(match[1]!);
  const [username, password] = decoded.split(':');
  return { username, password };
};

export const readServerAdminCredentials = (
  configService: ConfigService,
): UserCredentials => ({
  username: configService.getOrThrow(AppConfigKeys.E621_GLOBAL_USERNAME),
  password: configService.getOrThrow(AppConfigKeys.E621_GLOBAL_API_KEY),
});
