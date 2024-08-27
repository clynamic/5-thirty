export class Approval {
  id: number;
  postId: number;
  userId: number;
  createdAt: Date;
}

export class ApprovalQuery {
  /**
   * Start date for the query
   */
  start?: Date;
  /**
   * End date for the query
   */
  end?: Date;
}
