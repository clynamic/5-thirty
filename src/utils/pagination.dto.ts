import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_API_LIMIT } from 'src/api/http/params';

export class PaginationParams {
  constructor(partial?: Partial<PaginationParams>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static DEFAULT_PAGE_SIZE = 80;
  static DEFAULT_PAGE = 1;

  static calculateOffset(pages?: PaginationParams): number {
    return (
      ((pages?.page ?? this.DEFAULT_PAGE) - 1) *
      (pages?.limit ?? this.DEFAULT_PAGE_SIZE)
    );
  }

  @ApiProperty({
    description: 'Page number',
    required: false,
    default: PaginationParams.DEFAULT_PAGE,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Page size',
    required: false,
    default: PaginationParams.DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_API_LIMIT)
  @Type(() => Number)
  limit?: number;
}
