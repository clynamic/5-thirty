import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashboardVersions1731712294438 implements MigrationInterface {
  name = 'DashboardVersions1731712294438';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_dashboards" ("type" varchar NOT NULL, "user_id" integer NOT NULL, "positions" json NOT NULL, "meta" json NOT NULL, "version" integer NOT NULL DEFAULT (1), PRIMARY KEY ("type", "user_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_dashboards"("type", "user_id", "positions", "meta") SELECT "type", "user_id", "positions", "meta" FROM "dashboards"`,
    );
    await queryRunner.query(`DROP TABLE "dashboards"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_dashboards" RENAME TO "dashboards"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dashboards" RENAME TO "temporary_dashboards"`,
    );
    await queryRunner.query(
      `CREATE TABLE "dashboards" ("type" varchar NOT NULL, "user_id" integer NOT NULL, "positions" json NOT NULL, "meta" json NOT NULL, PRIMARY KEY ("type", "user_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "dashboards"("type", "user_id", "positions", "meta") SELECT "type", "user_id", "positions", "meta" FROM "temporary_dashboards"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_dashboards"`);
  }
}
