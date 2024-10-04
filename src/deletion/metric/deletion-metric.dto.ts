import { Raw } from 'src/utils';

export class PostDeletedActivityUserQuery {
  constructor(value: Raw<PostDeletedActivityUserQuery>) {
    Object.assign(this, value);
  }

  creatorId: number;
}

export class PostDeletedUserQuery {
  constructor(value: Raw<PostDeletedUserQuery>) {
    Object.assign(this, value);
  }

  creatorId?: number;
}
