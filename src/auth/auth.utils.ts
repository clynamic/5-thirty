import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AppConfigKeys } from 'src/app';
import fs from 'fs';
import { UserCredentials } from './auth.dto';

export const readJwtSecret = (config: ConfigService) => {
  const file =
    config.get<string>(AppConfigKeys.JWT_SECRET_FILE) || '.jwt-secret';
  let secret = '';

  try {
    secret = fs.readFileSync(file, 'utf-8');
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
  const decoded = atob(match[1]);
  const [username, password] = decoded.split(':');
  return { username, password };
};
