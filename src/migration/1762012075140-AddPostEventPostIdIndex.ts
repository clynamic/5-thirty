import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostEventPostIdIndex1762012075140
  implements MigrationInterface
{
  name = 'AddPostEventPostIdIndex1762012075140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_6890142eca00d1b59e9769e499" ON "post_events" ("post_id", "action", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6890142eca00d1b59e9769e499"`,
    );
  }
}
