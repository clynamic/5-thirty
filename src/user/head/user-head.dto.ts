import { Raw } from 'src/common';

export class UserHead {
  constructor(value: Raw<UserHead>) {
    Object.assign(this, value);
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
