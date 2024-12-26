import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostStatusIndices1731609037819 implements MigrationInterface {
  name = 'PostStatusIndices1731609037819';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219" ON "permits" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_2565bad45a3e088f09587b63d6"`);
    await queryRunner.query(`DROP INDEX "IDX_bf4bf0e8f2e15a2793a541fa57"`);
    await queryRunner.query(`DROP INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219"`);
    await queryRunner.query(`DROP INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9"`);
  }
}
