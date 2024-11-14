export class PostStatusSummary {
  constructor(value: PostStatusSummary) {
    Object.assign(this, value);
  }

  pending: number;
  approved: number;
  deleted: number;
  permitted: number;
}
