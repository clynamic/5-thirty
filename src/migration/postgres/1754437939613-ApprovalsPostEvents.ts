import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApprovalsPostEvents1754437939613 implements MigrationInterface {
  name = 'ApprovalsPostEvents1754437939613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."manifests_type_enum" RENAME TO "manifests_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."manifests_type_enum" AS ENUM('tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'post_events', 'mod_actions', 'bulk_update_requests', 'tag_aliases', 'tag_implications')`,
    );
    await queryRunner.query(
      `ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum" USING "type"::"text"::"public"."manifests_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."manifests_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."manifests_type_enum_old" AS ENUM('approvals', 'tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'post_events', 'mod_actions', 'bulk_update_requests', 'tag_aliases', 'tag_implications')`,
    );
    await queryRunner.query(
      `ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum_old" USING "type"::"text"::"public"."manifests_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."manifests_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."manifests_type_enum_old" RENAME TO "manifests_type_enum"`,
    );
  }
}
