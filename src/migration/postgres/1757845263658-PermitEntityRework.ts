import { MigrationInterface, QueryRunner } from 'typeorm';

export class PermitEntityRework1757845263658 implements MigrationInterface {
  name = 'PermitEntityRework1757845263658';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "permits"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd9ef5a04ed4a0bf79bf3a7219"`,
    );
    await queryRunner.query(`ALTER TABLE "permits" DROP COLUMN "post_id"`);
    await queryRunner.query(`ALTER TABLE "permits" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "permits" ADD "uploader_id" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "permits" ADD "label_id" text`);
    await queryRunner.query(
      `ALTER TABLE "permits" ADD CONSTRAINT "UQ_1925715bf5bb29a920685948ecf" UNIQUE ("label_id")`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."manifests_type_enum" RENAME TO "manifests_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."manifests_type_enum" AS ENUM('tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'post_events', 'mod_actions', 'bulk_update_requests', 'tag_aliases', 'tag_implications', 'permits')`,
    );
    await queryRunner.query(
      `ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum" USING "type"::"text"::"public"."manifests_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."manifests_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "permits" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "permits_id_seq"`);
    await queryRunner.query(
      `ALTER TABLE "permits" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_665010b0fad0d8da4843f903fc" ON "permits" ("uploader_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_225e516ca8a54261ad5a44a194" ON "permits" ("created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "permits" ADD CONSTRAINT "FK_1925715bf5bb29a920685948ecf" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "permits"`);

    await queryRunner.query(
      `ALTER TABLE "permits" DROP CONSTRAINT "FK_1925715bf5bb29a920685948ecf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_225e516ca8a54261ad5a44a194"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_665010b0fad0d8da4843f903fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permits" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "permits_id_seq" OWNED BY "permits"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permits" ALTER COLUMN "id" SET DEFAULT nextval('"permits_id_seq"')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."manifests_type_enum_old" AS ENUM('tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'post_events', 'mod_actions', 'bulk_update_requests', 'tag_aliases', 'tag_implications')`,
    );
    await queryRunner.query(
      `ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum_old" USING "type"::"text"::"public"."manifests_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."manifests_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."manifests_type_enum_old" RENAME TO "manifests_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permits" DROP CONSTRAINT "UQ_1925715bf5bb29a920685948ecf"`,
    );
    await queryRunner.query(`ALTER TABLE "permits" DROP COLUMN "label_id"`);
    await queryRunner.query(`ALTER TABLE "permits" DROP COLUMN "uploader_id"`);
    await queryRunner.query(
      `ALTER TABLE "permits" ADD "user_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "permits" ADD "post_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219" ON "permits" ("post_id") `,
    );
  }
}
