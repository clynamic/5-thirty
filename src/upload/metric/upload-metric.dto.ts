import { Raw, toRaws } from 'src/common';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { UserHead } from 'src/user/head/user-head.dto';
import { FindOptionsWhere } from 'typeorm';

export class PostUploadSeriesQuery {
  constructor(value: Raw<PostUploadSeriesQuery>) {
    Object.assign(this, value);
  }

  uploaderId?: number;

  where(): FindOptionsWhere<PostVersionEntity> {
    return toRaws({
      updaterId: this.uploaderId,
    });
  }
}

export class PostUploaderSummary {
  constructor(value: Raw<PostUploaderSummary>) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  position: number;
  days: number;
}
