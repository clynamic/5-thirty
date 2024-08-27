import { IsString, Length, Matches } from 'class-validator';

export class UserCredentials {
  @IsString()
  @Length(1)
  username: string;

  @IsString()
  @Matches(/^[A-z\d]{24,32}$/)
  password: string;
}
