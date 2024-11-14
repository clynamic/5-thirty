import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostVersionEntity } from 'src/post_version/post_version.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UploadSyncService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
  ) {}

  save = this.postVersionRepository.save.bind(this.postVersionRepository);
}
