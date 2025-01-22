import { MigrationInterface, QueryRunner } from 'typeorm';

export class Permits1731605005459 implements MigrationInterface {
  name = 'Permits1731605005459';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permits" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "user_id" integer NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "permits"`);
  }
}
