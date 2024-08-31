import { IsString, Length, Matches } from 'class-validator';

export class UserCredentials {
  @IsString()
  @Length(1)
  username: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9]{24,32}$/)
  password: string;
}

export class TokenValidation {
  token: string;
}
