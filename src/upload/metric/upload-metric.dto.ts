import { Raw, toRaws } from 'src/common';
import { PostVersionEntity } from 'src/post_version/post_version.entity';
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
