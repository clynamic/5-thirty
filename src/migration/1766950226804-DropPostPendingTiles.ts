import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPostPendingTiles1766950226804 implements MigrationInterface {
  name = 'DropPostPendingTiles1766950226804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1d110b6bc773b0ce822abf2512"`,
    );
    await queryRunner.query(`DROP TABLE "post_pending_hourly_tiles"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_pending_hourly_tiles" ("time" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_1d110b6bc773b0ce822abf25120" PRIMARY KEY ("time"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1d110b6bc773b0ce822abf2512" ON "post_pending_hourly_tiles" ("time")`,
    );
  }
}
