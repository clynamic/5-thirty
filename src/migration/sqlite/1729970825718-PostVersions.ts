import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostVersions1729970825718 implements MigrationInterface {
  name = 'PostVersions1729970825718';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_versions" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "cache_id" text, CONSTRAINT "REL_f26587860d092d5671965d0d89" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id" FROM "manifests"`,
    );
    await queryRunner.query(`DROP TABLE "manifests"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_manifests" RENAME TO "manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_post_versions" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "cache_id" text, CONSTRAINT "REL_f26587860d092d5671965d0d89" UNIQUE ("cache_id"), CONSTRAINT "FK_f26587860d092d5671965d0d899" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_post_versions"("id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "cache_id") SELECT "id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "cache_id" FROM "post_versions"`,
    );
    await queryRunner.query(`DROP TABLE "post_versions"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_post_versions" RENAME TO "post_versions"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_versions" RENAME TO "temporary_post_versions"`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_versions" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "cache_id" text, CONSTRAINT "REL_f26587860d092d5671965d0d89" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "post_versions"("id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "cache_id") SELECT "id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "cache_id" FROM "temporary_post_versions"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_post_versions"`);
    await queryRunner.query(
      `ALTER TABLE "manifests" RENAME TO "temporary_manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id" FROM "temporary_manifests"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_manifests"`);
    await queryRunner.query(`DROP TABLE "post_versions"`);
  }
}
