import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostReplacements1733331650005 implements MigrationInterface {
  name = 'PostReplacements1733331650005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_replacements" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL, "creator_id" integer NOT NULL, "updated_at" datetime NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" varchar CHECK( "status" IN ('original','pending','rejected','approved','promoted') ) NOT NULL, "reason" text NOT NULL, "cache_id" text, CONSTRAINT "REL_06fcb314258a46c0506c8934cb" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL, "refreshed_at" datetime)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id" FROM "manifests"`,
    );
    await queryRunner.query(`DROP TABLE "manifests"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_manifests" RENAME TO "manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions','post_replacements') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL, "refreshed_at" datetime)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at" FROM "manifests"`,
    );
    await queryRunner.query(`DROP TABLE "manifests"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_manifests" RENAME TO "manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_post_replacements" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL, "creator_id" integer NOT NULL, "updated_at" datetime NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" varchar CHECK( "status" IN ('original','pending','rejected','approved','promoted') ) NOT NULL, "reason" text NOT NULL, "cache_id" text, CONSTRAINT "REL_06fcb314258a46c0506c8934cb" UNIQUE ("cache_id"), CONSTRAINT "FK_06fcb314258a46c0506c8934cb0" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_post_replacements"("id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "cache_id") SELECT "id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "cache_id" FROM "post_replacements"`,
    );
    await queryRunner.query(`DROP TABLE "post_replacements"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_post_replacements" RENAME TO "post_replacements"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_replacements" RENAME TO "temporary_post_replacements"`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_replacements" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL, "creator_id" integer NOT NULL, "updated_at" datetime NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" varchar CHECK( "status" IN ('original','pending','rejected','approved','promoted') ) NOT NULL, "reason" text NOT NULL, "cache_id" text, CONSTRAINT "REL_06fcb314258a46c0506c8934cb" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "post_replacements"("id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "cache_id") SELECT "id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "cache_id" FROM "temporary_post_replacements"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_post_replacements"`);
    await queryRunner.query(
      `ALTER TABLE "manifests" RENAME TO "temporary_manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL, "refreshed_at" datetime)`,
    );
    await queryRunner.query(
      `INSERT INTO "manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at" FROM "temporary_manifests"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_manifests"`);
    await queryRunner.query(
      `ALTER TABLE "manifests" RENAME TO "temporary_manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id" FROM "temporary_manifests"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_manifests"`);
    await queryRunner.query(`DROP TABLE "post_replacements"`);
  }
}
