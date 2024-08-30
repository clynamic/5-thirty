export class UserHead {
  constructor(partial?: Partial<UserHead>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * User ID
   */
  id: number;
  /**
   * User name
   */
  name: string;
  /**
   * User avatar URL
   */
  avatar?: string;
  /**
   * User level string
   */
  level: string;
}
