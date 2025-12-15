import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostLifecycle1766949660258 implements MigrationInterface {
  name = 'CreatePostLifecycle1766949660258';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_lifecycle" ("post_id" integer NOT NULL, "uploaded_at" TIMESTAMP WITH TIME ZONE, "approved_at" TIMESTAMP WITH TIME ZONE, "deleted_at" TIMESTAMP WITH TIME ZONE, "permitted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5d5823871bcb925dafaf8bd1217" PRIMARY KEY ("post_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f01b0384610fe312d0734fde2c" ON "post_lifecycle" ("permitted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_651dc390d8b9d55b368d4b0d6e" ON "post_lifecycle" ("deleted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f39a0e7fa1d7263e1dcca02d67" ON "post_lifecycle" ("approved_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b15705d49a00bc4257c9042ceb" ON "post_lifecycle" ("uploaded_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b15705d49a00bc4257c9042ceb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f39a0e7fa1d7263e1dcca02d67"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_651dc390d8b9d55b368d4b0d6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f01b0384610fe312d0734fde2c"`,
    );
    await queryRunner.query(`DROP TABLE "post_lifecycle"`);
  }
}
