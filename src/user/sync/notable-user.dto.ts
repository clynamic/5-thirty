import { NotabilityType } from './notable-user.entity';

export class NotableUserQuery {
  constructor(partial?: Partial<NotableUserQuery>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  id?: number;
  type?: NotabilityType[];
  newerThan?: Date;
}
