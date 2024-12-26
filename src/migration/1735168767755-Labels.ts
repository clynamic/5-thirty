import { MigrationInterface, QueryRunner } from 'typeorm';

export class Labels1735168767755 implements MigrationInterface {
  name = 'Labels1735168767755';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete all old tables
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME TO "temporary_user_profiles"`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "artist_version_count" integer, "comment_count" integer, "favorite_count" integer, "flag_count" integer, "forum_post_count" integer, "note_update_count" integer NOT NULL, "pool_version_count" integer, "negative_feedback_count" integer, "neutral_feedback_count" integer, "positive_feedback_count" integer, "post_update_count" integer NOT NULL, "post_upload_count" integer NOT NULL, "upload_limit" integer, "wiki_page_version_count" integer, "profile_about" text, "profile_artinfo" text, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_4251320743c07fc774f5df2d6e" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "user_profiles"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "cache_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "cache_id" FROM "temporary_user_profiles"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user_profiles"`);
    await queryRunner.query(`DROP INDEX "IDX_8f36a17c106cce6b46cb193cb4"`);
    await queryRunner.query(`DROP INDEX "IDX_2565bad45a3e088f09587b63d6"`);
    await queryRunner.query(
      `ALTER TABLE "approvals" RENAME TO "temporary_approvals"`,
    );
    await queryRunner.query(
      `CREATE TABLE "approvals" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_67e2665e33b635b2a40a1fe6af" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "approvals"("id", "post_id", "user_id", "created_at", "cache_id") SELECT "id", "post_id", "user_id", "created_at", "cache_id" FROM "temporary_approvals"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_approvals"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8f36a17c106cce6b46cb193cb4" ON "approvals" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "feedbacks" RENAME TO "temporary_feedbacks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" integer PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "body" text NOT NULL, "category" varchar CHECK( "category" IN ('negative','positive','neutral') ) NOT NULL, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "cache_id" text, CONSTRAINT "REL_c0680aca0d4ffd84a9311d657a" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "feedbacks"("id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "cache_id") SELECT "id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "cache_id" FROM "temporary_feedbacks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_feedbacks"`);
    await queryRunner.query(`DROP INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7"`);
    await queryRunner.query(`DROP INDEX "IDX_bf4bf0e8f2e15a2793a541fa57"`);
    await queryRunner.query(`ALTER TABLE "flags" RENAME TO "temporary_flags"`);
    await queryRunner.query(
      `CREATE TABLE "flags" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "is_resolved" boolean NOT NULL, "reason" text NOT NULL, "type" varchar CHECK( "type" IN ('flag','deletion') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_8b03c8d23b308e8de2d7a143c9" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "flags"("id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "cache_id") SELECT "id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "cache_id" FROM "temporary_flags"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_flags"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7" ON "flags" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `,
    );
    await queryRunner.query(`ALTER TABLE "posts" RENAME TO "temporary_posts"`);
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" integer PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "file" text, "preview" text, "sample" text, "extension" text NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "favorites" integer NOT NULL, "score" integer NOT NULL, "description" text NOT NULL, "uploader_id" integer NOT NULL, "approver_id" integer, "tags" json NOT NULL, "deleted" boolean NOT NULL, "cache_id" text, CONSTRAINT "REL_0072d97a07bbd66a8e27d8e6e1" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "posts"("id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "cache_id") SELECT "id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "cache_id" FROM "temporary_posts"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_posts"`);
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
    await queryRunner.query(`DROP INDEX "IDX_72cdf4b302dcf3097dd04854bd"`);
    await queryRunner.query(
      `ALTER TABLE "mod_actions" RENAME TO "temporary_mod_actions"`,
    );
    await queryRunner.query(
      `CREATE TABLE "mod_actions" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "cache_id" text, CONSTRAINT "REL_07699e0d1a08ae18b962af9908" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "mod_actions"("id", "creator_id", "created_at", "updated_at", "action", "values", "cache_id") SELECT "id", "creator_id", "created_at", "updated_at", "action", "values", "cache_id" FROM "temporary_mod_actions"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_mod_actions"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9"`);
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
      `CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_09a4d6db964c6b6ce11f8f1d92"`);
    await queryRunner.query(`DROP INDEX "IDX_12b901b34113688b4786368510"`);
    await queryRunner.query(
      `ALTER TABLE "tickets" RENAME TO "temporary_tickets"`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "claimant_id" integer, "handler_id" integer, "accused_id" integer, "disp_id" integer, "qtype" varchar CHECK( "qtype" IN ('user','comment','forum','blip','wiki','pool','set','post','dmail') ) NOT NULL, "reason" text NOT NULL, "report_reason" text, "response" text NOT NULL, "status" varchar CHECK( "status" IN ('pending','approved','partial') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_c8dd3fb080a4dc414d614549ae" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "tickets"("id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "cache_id") SELECT "id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "cache_id" FROM "temporary_tickets"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_tickets"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_09a4d6db964c6b6ce11f8f1d92" ON "tickets" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `,
    );
    await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_4cd1b18d1758403c2dd87a3c05" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "users"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "cache_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "cache_id" FROM "temporary_users"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_users"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "notable_users"`);
    await queryRunner.query(`DROP INDEX "IDX_8f36a17c106cce6b46cb193cb4"`);
    await queryRunner.query(`DROP INDEX "IDX_2565bad45a3e088f09587b63d6"`);
    await queryRunner.query(`DROP TABLE "approvals"`);
    await queryRunner.query(`DROP TABLE "dashboards"`);
    await queryRunner.query(`DROP TABLE "feedbacks"`);
    await queryRunner.query(`DROP INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7"`);
    await queryRunner.query(`DROP INDEX "IDX_bf4bf0e8f2e15a2793a541fa57"`);
    await queryRunner.query(`DROP TABLE "flags"`);
    await queryRunner.query(`DROP TABLE "manifests"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219"`);
    await queryRunner.query(`DROP TABLE "permits"`);
    await queryRunner.query(`DROP TABLE "post_replacements"`);
    await queryRunner.query(`DROP INDEX "IDX_72cdf4b302dcf3097dd04854bd"`);
    await queryRunner.query(`DROP TABLE "mod_actions"`);
    await queryRunner.query(`DROP INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9"`);
    await queryRunner.query(`DROP TABLE "post_versions"`);
    await queryRunner.query(`DROP INDEX "IDX_09a4d6db964c6b6ce11f8f1d92"`);
    await queryRunner.query(`DROP INDEX "IDX_12b901b34113688b4786368510"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "caches"`);

    // Create new tables
    await queryRunner.query(
      `CREATE TABLE "labels" ("id" text PRIMARY KEY NOT NULL, "refreshed_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_c46e2ccc7cf6b846f4c45aa8e7" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notable_users" ("id" integer PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('staff','reporter','uploader') ) NOT NULL, "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_versions" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "label_id" text, CONSTRAINT "REL_95579fd9d390af95643694b70f" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "claimant_id" integer, "handler_id" integer, "accused_id" integer, "disp_id" integer, "qtype" varchar CHECK( "qtype" IN ('user','comment','forum','blip','wiki','pool','set','post','dmail') ) NOT NULL, "reason" text NOT NULL, "report_reason" text, "response" text NOT NULL, "status" varchar CHECK( "status" IN ('pending','approved','partial') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_8733cf1924636c2be0ef0bffb3" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09a4d6db964c6b6ce11f8f1d92" ON "tickets" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "permits" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "user_id" integer NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219" ON "permits" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "mod_actions" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "label_id" text, CONSTRAINT "REL_a6fbe4bd234f5cd1ce730f6123" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "post_replacements" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL, "creator_id" integer NOT NULL, "updated_at" datetime NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" varchar CHECK( "status" IN ('original','pending','rejected','approved','promoted') ) NOT NULL, "reason" text NOT NULL, "label_id" text, CONSTRAINT "REL_61c67b0ddfde13edecd4d2ea43" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" integer PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "file" text, "preview" text, "sample" text, "extension" text NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "favorites" integer NOT NULL, "score" integer NOT NULL, "description" text NOT NULL, "uploader_id" integer NOT NULL, "approver_id" integer, "tags" json NOT NULL, "deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_0d6fb074aee1e66301eefc69f8" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions','post_replacements','mod_actions') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "refreshed_at" datetime, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "flags" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "is_resolved" boolean NOT NULL, "reason" text NOT NULL, "type" varchar CHECK( "type" IN ('flag','deletion') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_86d80e82fac1719346cf803a55" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7" ON "flags" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "dashboards" ("type" varchar CHECK( "type" IN ('moderator','janitor','admin') ) NOT NULL, "user_id" integer NOT NULL, "version" integer NOT NULL DEFAULT (1), "positions" json NOT NULL, "meta" json NOT NULL, PRIMARY KEY ("type", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" integer PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "body" text NOT NULL, "category" varchar CHECK( "category" IN ('negative','positive','neutral') ) NOT NULL, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_4f2b5536c790b9078cc269e07d" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "approvals" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_6ec666fa54dc79a0f4c695c217" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f36a17c106cce6b46cb193cb4" ON "approvals" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "artist_version_count" integer, "comment_count" integer, "favorite_count" integer, "flag_count" integer, "forum_post_count" integer, "note_update_count" integer NOT NULL, "pool_version_count" integer, "negative_feedback_count" integer, "neutral_feedback_count" integer, "positive_feedback_count" integer, "post_update_count" integer NOT NULL, "post_upload_count" integer NOT NULL, "upload_limit" integer, "wiki_page_version_count" integer, "profile_about" text, "profile_artinfo" text, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_5e1f6f4f9109311910c7f646f7" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_users" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_c46e2ccc7cf6b846f4c45aa8e7" UNIQUE ("label_id"), CONSTRAINT "FK_c46e2ccc7cf6b846f4c45aa8e79" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_users"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "label_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "label_id" FROM "users"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
    await queryRunner.query(`DROP INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_post_versions" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "label_id" text, CONSTRAINT "REL_95579fd9d390af95643694b70f" UNIQUE ("label_id"), CONSTRAINT "FK_95579fd9d390af95643694b70f5" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_post_versions"("id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "label_id") SELECT "id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "label_id" FROM "post_versions"`,
    );
    await queryRunner.query(`DROP TABLE "post_versions"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_post_versions" RENAME TO "post_versions"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_12b901b34113688b4786368510"`);
    await queryRunner.query(`DROP INDEX "IDX_09a4d6db964c6b6ce11f8f1d92"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_tickets" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "claimant_id" integer, "handler_id" integer, "accused_id" integer, "disp_id" integer, "qtype" varchar CHECK( "qtype" IN ('user','comment','forum','blip','wiki','pool','set','post','dmail') ) NOT NULL, "reason" text NOT NULL, "report_reason" text, "response" text NOT NULL, "status" varchar CHECK( "status" IN ('pending','approved','partial') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_8733cf1924636c2be0ef0bffb3" UNIQUE ("label_id"), CONSTRAINT "FK_8733cf1924636c2be0ef0bffb37" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_tickets"("id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "label_id") SELECT "id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "label_id" FROM "tickets"`,
    );
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_tickets" RENAME TO "tickets"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09a4d6db964c6b6ce11f8f1d92" ON "tickets" ("created_at") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_72cdf4b302dcf3097dd04854bd"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_mod_actions" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "label_id" text, CONSTRAINT "REL_a6fbe4bd234f5cd1ce730f6123" UNIQUE ("label_id"), CONSTRAINT "FK_a6fbe4bd234f5cd1ce730f61235" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_mod_actions"("id", "creator_id", "created_at", "updated_at", "action", "values", "label_id") SELECT "id", "creator_id", "created_at", "updated_at", "action", "values", "label_id" FROM "mod_actions"`,
    );
    await queryRunner.query(`DROP TABLE "mod_actions"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_mod_actions" RENAME TO "mod_actions"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_post_replacements" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL, "creator_id" integer NOT NULL, "updated_at" datetime NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" varchar CHECK( "status" IN ('original','pending','rejected','approved','promoted') ) NOT NULL, "reason" text NOT NULL, "label_id" text, CONSTRAINT "REL_61c67b0ddfde13edecd4d2ea43" UNIQUE ("label_id"), CONSTRAINT "FK_61c67b0ddfde13edecd4d2ea433" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_post_replacements"("id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "label_id") SELECT "id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "label_id" FROM "post_replacements"`,
    );
    await queryRunner.query(`DROP TABLE "post_replacements"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_post_replacements" RENAME TO "post_replacements"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_posts" ("id" integer PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "file" text, "preview" text, "sample" text, "extension" text NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "favorites" integer NOT NULL, "score" integer NOT NULL, "description" text NOT NULL, "uploader_id" integer NOT NULL, "approver_id" integer, "tags" json NOT NULL, "deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_0d6fb074aee1e66301eefc69f8" UNIQUE ("label_id"), CONSTRAINT "FK_0d6fb074aee1e66301eefc69f81" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_posts"("id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "label_id") SELECT "id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "label_id" FROM "posts"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`ALTER TABLE "temporary_posts" RENAME TO "posts"`);
    await queryRunner.query(`DROP INDEX "IDX_bf4bf0e8f2e15a2793a541fa57"`);
    await queryRunner.query(`DROP INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_flags" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "is_resolved" boolean NOT NULL, "reason" text NOT NULL, "type" varchar CHECK( "type" IN ('flag','deletion') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_86d80e82fac1719346cf803a55" UNIQUE ("label_id"), CONSTRAINT "FK_86d80e82fac1719346cf803a550" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_flags"("id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "label_id") SELECT "id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "label_id" FROM "flags"`,
    );
    await queryRunner.query(`DROP TABLE "flags"`);
    await queryRunner.query(`ALTER TABLE "temporary_flags" RENAME TO "flags"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7" ON "flags" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_feedbacks" ("id" integer PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "body" text NOT NULL, "category" varchar CHECK( "category" IN ('negative','positive','neutral') ) NOT NULL, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_4f2b5536c790b9078cc269e07d" UNIQUE ("label_id"), CONSTRAINT "FK_4f2b5536c790b9078cc269e07d5" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_feedbacks"("id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "label_id") SELECT "id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "label_id" FROM "feedbacks"`,
    );
    await queryRunner.query(`DROP TABLE "feedbacks"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_feedbacks" RENAME TO "feedbacks"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_2565bad45a3e088f09587b63d6"`);
    await queryRunner.query(`DROP INDEX "IDX_8f36a17c106cce6b46cb193cb4"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_approvals" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_6ec666fa54dc79a0f4c695c217" UNIQUE ("label_id"), CONSTRAINT "FK_6ec666fa54dc79a0f4c695c2176" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_approvals"("id", "post_id", "user_id", "created_at", "label_id") SELECT "id", "post_id", "user_id", "created_at", "label_id" FROM "approvals"`,
    );
    await queryRunner.query(`DROP TABLE "approvals"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_approvals" RENAME TO "approvals"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f36a17c106cce6b46cb193cb4" ON "approvals" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_profiles" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "artist_version_count" integer, "comment_count" integer, "favorite_count" integer, "flag_count" integer, "forum_post_count" integer, "note_update_count" integer NOT NULL, "pool_version_count" integer, "negative_feedback_count" integer, "neutral_feedback_count" integer, "positive_feedback_count" integer, "post_update_count" integer NOT NULL, "post_upload_count" integer NOT NULL, "upload_limit" integer, "wiki_page_version_count" integer, "profile_about" text, "profile_artinfo" text, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_5e1f6f4f9109311910c7f646f7" UNIQUE ("label_id"), CONSTRAINT "FK_5e1f6f4f9109311910c7f646f7c" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_profiles"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "label_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "label_id" FROM "user_profiles"`,
    );
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_profiles" RENAME TO "user_profiles"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete all new tables
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME TO "temporary_user_profiles"`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "artist_version_count" integer, "comment_count" integer, "favorite_count" integer, "flag_count" integer, "forum_post_count" integer, "note_update_count" integer NOT NULL, "pool_version_count" integer, "negative_feedback_count" integer, "neutral_feedback_count" integer, "positive_feedback_count" integer, "post_update_count" integer NOT NULL, "post_upload_count" integer NOT NULL, "upload_limit" integer, "wiki_page_version_count" integer, "profile_about" text, "profile_artinfo" text, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_5e1f6f4f9109311910c7f646f7" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "user_profiles"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "label_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "label_id" FROM "temporary_user_profiles"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_user_profiles"`);
    await queryRunner.query(`DROP INDEX "IDX_8f36a17c106cce6b46cb193cb4"`);
    await queryRunner.query(`DROP INDEX "IDX_2565bad45a3e088f09587b63d6"`);
    await queryRunner.query(
      `ALTER TABLE "approvals" RENAME TO "temporary_approvals"`,
    );
    await queryRunner.query(
      `CREATE TABLE "approvals" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_6ec666fa54dc79a0f4c695c217" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "approvals"("id", "post_id", "user_id", "created_at", "label_id") SELECT "id", "post_id", "user_id", "created_at", "label_id" FROM "temporary_approvals"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_approvals"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_8f36a17c106cce6b46cb193cb4" ON "approvals" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "feedbacks" RENAME TO "temporary_feedbacks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" integer PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "body" text NOT NULL, "category" varchar CHECK( "category" IN ('negative','positive','neutral') ) NOT NULL, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_4f2b5536c790b9078cc269e07d" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "feedbacks"("id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "label_id") SELECT "id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "label_id" FROM "temporary_feedbacks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_feedbacks"`);
    await queryRunner.query(`DROP INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7"`);
    await queryRunner.query(`DROP INDEX "IDX_bf4bf0e8f2e15a2793a541fa57"`);
    await queryRunner.query(`ALTER TABLE "flags" RENAME TO "temporary_flags"`);
    await queryRunner.query(
      `CREATE TABLE "flags" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "is_resolved" boolean NOT NULL, "reason" text NOT NULL, "type" varchar CHECK( "type" IN ('flag','deletion') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_86d80e82fac1719346cf803a55" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "flags"("id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "label_id") SELECT "id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "label_id" FROM "temporary_flags"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_flags"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7" ON "flags" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `,
    );
    await queryRunner.query(`ALTER TABLE "posts" RENAME TO "temporary_posts"`);
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" integer PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "file" text, "preview" text, "sample" text, "extension" text NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "favorites" integer NOT NULL, "score" integer NOT NULL, "description" text NOT NULL, "uploader_id" integer NOT NULL, "approver_id" integer, "tags" json NOT NULL, "deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_0d6fb074aee1e66301eefc69f8" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "posts"("id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "label_id") SELECT "id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "label_id" FROM "temporary_posts"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_posts"`);
    await queryRunner.query(
      `ALTER TABLE "post_replacements" RENAME TO "temporary_post_replacements"`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_replacements" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL, "creator_id" integer NOT NULL, "updated_at" datetime NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" varchar CHECK( "status" IN ('original','pending','rejected','approved','promoted') ) NOT NULL, "reason" text NOT NULL, "label_id" text, CONSTRAINT "REL_61c67b0ddfde13edecd4d2ea43" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "post_replacements"("id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "label_id") SELECT "id", "post_id", "created_at", "creator_id", "updated_at", "approver_id", "file_ext", "file_size", "image_height", "image_width", "md5", "source", "file_name", "status", "reason", "label_id" FROM "temporary_post_replacements"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_post_replacements"`);
    await queryRunner.query(`DROP INDEX "IDX_72cdf4b302dcf3097dd04854bd"`);
    await queryRunner.query(
      `ALTER TABLE "mod_actions" RENAME TO "temporary_mod_actions"`,
    );
    await queryRunner.query(
      `CREATE TABLE "mod_actions" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "label_id" text, CONSTRAINT "REL_a6fbe4bd234f5cd1ce730f6123" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "mod_actions"("id", "creator_id", "created_at", "updated_at", "action", "values", "label_id") SELECT "id", "creator_id", "created_at", "updated_at", "action", "values", "label_id" FROM "temporary_mod_actions"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_mod_actions"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_09a4d6db964c6b6ce11f8f1d92"`);
    await queryRunner.query(`DROP INDEX "IDX_12b901b34113688b4786368510"`);
    await queryRunner.query(
      `ALTER TABLE "tickets" RENAME TO "temporary_tickets"`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "claimant_id" integer, "handler_id" integer, "accused_id" integer, "disp_id" integer, "qtype" varchar CHECK( "qtype" IN ('user','comment','forum','blip','wiki','pool','set','post','dmail') ) NOT NULL, "reason" text NOT NULL, "report_reason" text, "response" text NOT NULL, "status" varchar CHECK( "status" IN ('pending','approved','partial') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_8733cf1924636c2be0ef0bffb3" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "tickets"("id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "label_id") SELECT "id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "label_id" FROM "temporary_tickets"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_tickets"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_09a4d6db964c6b6ce11f8f1d92" ON "tickets" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9"`);
    await queryRunner.query(
      `ALTER TABLE "post_versions" RENAME TO "temporary_post_versions"`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_versions" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "label_id" text, CONSTRAINT "REL_95579fd9d390af95643694b70f" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "post_versions"("id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "label_id") SELECT "id", "post_id", "description", "description_changed", "rating", "rating_changed", "source", "source_changed", "parent_id", "parent_changed", "reason", "added_locked_tags", "added_tags", "locked_tags", "obsolete_added_tags", "obsolete_removed_tags", "removed_locked_tags", "removed_tags", "tags", "unchanged_tags", "updated_at", "updater_id", "updater_name", "version", "label_id" FROM "temporary_post_versions"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_post_versions"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `,
    );
    await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "created_at" datetime NOT NULL, "label_id" text, CONSTRAINT "REL_c46e2ccc7cf6b846f4c45aa8e7" UNIQUE ("label_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "users"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "label_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "label_id" FROM "temporary_users"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_users"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP INDEX "IDX_8f36a17c106cce6b46cb193cb4"`);
    await queryRunner.query(`DROP INDEX "IDX_2565bad45a3e088f09587b63d6"`);
    await queryRunner.query(`DROP TABLE "approvals"`);
    await queryRunner.query(`DROP TABLE "feedbacks"`);
    await queryRunner.query(`DROP TABLE "dashboards"`);
    await queryRunner.query(`DROP INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7"`);
    await queryRunner.query(`DROP INDEX "IDX_bf4bf0e8f2e15a2793a541fa57"`);
    await queryRunner.query(`DROP TABLE "flags"`);
    await queryRunner.query(`DROP TABLE "manifests"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "post_replacements"`);
    await queryRunner.query(`DROP INDEX "IDX_72cdf4b302dcf3097dd04854bd"`);
    await queryRunner.query(`DROP TABLE "mod_actions"`);
    await queryRunner.query(`DROP INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219"`);
    await queryRunner.query(`DROP TABLE "permits"`);
    await queryRunner.query(`DROP INDEX "IDX_09a4d6db964c6b6ce11f8f1d92"`);
    await queryRunner.query(`DROP INDEX "IDX_12b901b34113688b4786368510"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9"`);
    await queryRunner.query(`DROP TABLE "post_versions"`);
    await queryRunner.query(`DROP TABLE "notable_users"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "labels"`);

    // Create all old tables
    await queryRunner.query(
      `CREATE TABLE "caches" ("id" text PRIMARY KEY NOT NULL, "refreshed_at" datetime NOT NULL DEFAULT (datetime('now')), "value" json NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_4cd1b18d1758403c2dd87a3c05" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "claimant_id" integer, "handler_id" integer, "accused_id" integer, "disp_id" integer, "qtype" varchar CHECK( "qtype" IN ('user','comment','forum','blip','wiki','pool','set','post','dmail') ) NOT NULL, "reason" text NOT NULL, "report_reason" text, "response" text NOT NULL, "status" varchar CHECK( "status" IN ('pending','approved','partial') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_c8dd3fb080a4dc414d614549ae" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09a4d6db964c6b6ce11f8f1d92" ON "tickets" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "post_versions" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "cache_id" text, CONSTRAINT "REL_f26587860d092d5671965d0d89" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "mod_actions" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "cache_id" text, CONSTRAINT "REL_07699e0d1a08ae18b962af9908" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "post_replacements" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL, "creator_id" integer NOT NULL, "updated_at" datetime NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" varchar CHECK( "status" IN ('original','pending','rejected','approved','promoted') ) NOT NULL, "reason" text NOT NULL, "cache_id" text, CONSTRAINT "REL_06fcb314258a46c0506c8934cb" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "permits" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "user_id" integer NOT NULL, "post_id" integer NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219" ON "permits" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" integer PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "file" text, "preview" text, "sample" text, "extension" text NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "favorites" integer NOT NULL, "score" integer NOT NULL, "description" text NOT NULL, "uploader_id" integer NOT NULL, "approver_id" integer, "tags" json NOT NULL, "deleted" boolean NOT NULL, "cache_id" text, CONSTRAINT "REL_0072d97a07bbd66a8e27d8e6e1" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions','post_replacements','mod_actions') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "refreshed_at" datetime, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "flags" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "is_resolved" boolean NOT NULL, "reason" text NOT NULL, "type" varchar CHECK( "type" IN ('flag','deletion') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_8b03c8d23b308e8de2d7a143c9" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7" ON "flags" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" integer PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "body" text NOT NULL, "category" varchar CHECK( "category" IN ('negative','positive','neutral') ) NOT NULL, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "cache_id" text, CONSTRAINT "REL_c0680aca0d4ffd84a9311d657a" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dashboards" ("type" varchar CHECK( "type" IN ('moderator','janitor','admin') ) NOT NULL, "user_id" integer NOT NULL, "version" integer NOT NULL DEFAULT (1), "positions" json NOT NULL, "meta" json NOT NULL, PRIMARY KEY ("type", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "approvals" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_67e2665e33b635b2a40a1fe6af" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f36a17c106cce6b46cb193cb4" ON "approvals" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notable_users" ("id" integer PRIMARY KEY NOT NULL, "type" varchar CHECK( "type" IN ('staff','reporter','uploader') ) NOT NULL, "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "artist_version_count" integer, "comment_count" integer, "favorite_count" integer, "flag_count" integer, "forum_post_count" integer, "note_update_count" integer NOT NULL, "pool_version_count" integer, "negative_feedback_count" integer, "neutral_feedback_count" integer, "positive_feedback_count" integer, "post_update_count" integer NOT NULL, "post_upload_count" integer NOT NULL, "upload_limit" integer, "wiki_page_version_count" integer, "profile_about" text, "profile_artinfo" text, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_4251320743c07fc774f5df2d6e" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_users" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_4cd1b18d1758403c2dd87a3c05" UNIQUE ("cache_id"), CONSTRAINT "FK_4cd1b18d1758403c2dd87a3c05d" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_users"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "cache_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "created_at", "cache_id" FROM "users"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
    await queryRunner.query(`DROP INDEX "IDX_12b901b34113688b4786368510"`);
    await queryRunner.query(`DROP INDEX "IDX_09a4d6db964c6b6ce11f8f1d92"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_tickets" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "claimant_id" integer, "handler_id" integer, "accused_id" integer, "disp_id" integer, "qtype" varchar CHECK( "qtype" IN ('user','comment','forum','blip','wiki','pool','set','post','dmail') ) NOT NULL, "reason" text NOT NULL, "report_reason" text, "response" text NOT NULL, "status" varchar CHECK( "status" IN ('pending','approved','partial') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_c8dd3fb080a4dc414d614549ae" UNIQUE ("cache_id"), CONSTRAINT "FK_c8dd3fb080a4dc414d614549ae2" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_tickets"("id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "cache_id") SELECT "id", "creator_id", "claimant_id", "handler_id", "accused_id", "disp_id", "qtype", "reason", "report_reason", "response", "status", "created_at", "updated_at", "cache_id" FROM "tickets"`,
    );
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_tickets" RENAME TO "tickets"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09a4d6db964c6b6ce11f8f1d92" ON "tickets" ("created_at") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9"`);
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
    await queryRunner.query(
      `CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_72cdf4b302dcf3097dd04854bd"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_mod_actions" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "cache_id" text, CONSTRAINT "REL_07699e0d1a08ae18b962af9908" UNIQUE ("cache_id"), CONSTRAINT "FK_07699e0d1a08ae18b962af99085" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_mod_actions"("id", "creator_id", "created_at", "updated_at", "action", "values", "cache_id") SELECT "id", "creator_id", "created_at", "updated_at", "action", "values", "cache_id" FROM "mod_actions"`,
    );
    await queryRunner.query(`DROP TABLE "mod_actions"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_mod_actions" RENAME TO "mod_actions"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `,
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
    await queryRunner.query(
      `CREATE TABLE "temporary_posts" ("id" integer PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "file" text, "preview" text, "sample" text, "extension" text NOT NULL, "rating" varchar CHECK( "rating" IN ('s','q','e') ) NOT NULL, "favorites" integer NOT NULL, "score" integer NOT NULL, "description" text NOT NULL, "uploader_id" integer NOT NULL, "approver_id" integer, "tags" json NOT NULL, "deleted" boolean NOT NULL, "cache_id" text, CONSTRAINT "REL_0072d97a07bbd66a8e27d8e6e1" UNIQUE ("cache_id"), CONSTRAINT "FK_0072d97a07bbd66a8e27d8e6e1b" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_posts"("id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "cache_id") SELECT "id", "created_at", "updated_at", "file", "preview", "sample", "extension", "rating", "favorites", "score", "description", "uploader_id", "approver_id", "tags", "deleted", "cache_id" FROM "posts"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`ALTER TABLE "temporary_posts" RENAME TO "posts"`);
    await queryRunner.query(`DROP INDEX "IDX_bf4bf0e8f2e15a2793a541fa57"`);
    await queryRunner.query(`DROP INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_flags" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "is_resolved" boolean NOT NULL, "reason" text NOT NULL, "type" varchar CHECK( "type" IN ('flag','deletion') ) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_8b03c8d23b308e8de2d7a143c9" UNIQUE ("cache_id"), CONSTRAINT "FK_8b03c8d23b308e8de2d7a143c91" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_flags"("id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "cache_id") SELECT "id", "creator_id", "post_id", "is_resolved", "reason", "type", "created_at", "updated_at", "cache_id" FROM "flags"`,
    );
    await queryRunner.query(`DROP TABLE "flags"`);
    await queryRunner.query(`ALTER TABLE "temporary_flags" RENAME TO "flags"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7" ON "flags" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_feedbacks" ("id" integer PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "body" text NOT NULL, "category" varchar CHECK( "category" IN ('negative','positive','neutral') ) NOT NULL, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "cache_id" text, CONSTRAINT "REL_c0680aca0d4ffd84a9311d657a" UNIQUE ("cache_id"), CONSTRAINT "FK_c0680aca0d4ffd84a9311d657a0" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_feedbacks"("id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "cache_id") SELECT "id", "user_id", "creator_id", "created_at", "body", "category", "updated_at", "updater_id", "is_deleted", "cache_id" FROM "feedbacks"`,
    );
    await queryRunner.query(`DROP TABLE "feedbacks"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_feedbacks" RENAME TO "feedbacks"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_2565bad45a3e088f09587b63d6"`);
    await queryRunner.query(`DROP INDEX "IDX_8f36a17c106cce6b46cb193cb4"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_approvals" ("id" integer PRIMARY KEY NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_67e2665e33b635b2a40a1fe6af" UNIQUE ("cache_id"), CONSTRAINT "FK_67e2665e33b635b2a40a1fe6af4" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_approvals"("id", "post_id", "user_id", "created_at", "cache_id") SELECT "id", "post_id", "user_id", "created_at", "cache_id" FROM "approvals"`,
    );
    await queryRunner.query(`DROP TABLE "approvals"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_approvals" RENAME TO "approvals"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f36a17c106cce6b46cb193cb4" ON "approvals" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_profiles" ("id" integer PRIMARY KEY NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "artist_version_count" integer, "comment_count" integer, "favorite_count" integer, "flag_count" integer, "forum_post_count" integer, "note_update_count" integer NOT NULL, "pool_version_count" integer, "negative_feedback_count" integer, "neutral_feedback_count" integer, "positive_feedback_count" integer, "post_update_count" integer NOT NULL, "post_upload_count" integer NOT NULL, "upload_limit" integer, "wiki_page_version_count" integer, "profile_about" text, "profile_artinfo" text, "created_at" datetime NOT NULL, "cache_id" text, CONSTRAINT "REL_4251320743c07fc774f5df2d6e" UNIQUE ("cache_id"), CONSTRAINT "FK_4251320743c07fc774f5df2d6ec" FOREIGN KEY ("cache_id") REFERENCES "caches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_profiles"("id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "cache_id") SELECT "id", "name", "level", "level_string", "is_banned", "avatar_id", "base_upload_limit", "can_approve_posts", "can_upload_free", "artist_version_count", "comment_count", "favorite_count", "flag_count", "forum_post_count", "note_update_count", "pool_version_count", "negative_feedback_count", "neutral_feedback_count", "positive_feedback_count", "post_update_count", "post_upload_count", "upload_limit", "wiki_page_version_count", "profile_about", "profile_artinfo", "created_at", "cache_id" FROM "user_profiles"`,
    );
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_profiles" RENAME TO "user_profiles"`,
    );
  }
}
