export class PostReplacementStatusPoint {
  constructor(value: PostReplacementStatusPoint) {
    Object.assign(this, value);
  }

  date: Date;

  pending: number;
  rejected: number;
  approved: number;
  promoted: number;
}
