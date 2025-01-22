import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1737562225931 implements MigrationInterface {
    name = 'Initial1737562225931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "labels" ("id" text NOT NULL, "refreshed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."post_replacements_status_enum" AS ENUM('original', 'pending', 'rejected', 'approved', 'promoted')`);
        await queryRunner.query(`CREATE TABLE "post_replacements" ("id" integer NOT NULL, "post_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "creator_id" integer NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "approver_id" integer, "file_ext" text NOT NULL, "file_size" integer NOT NULL, "image_height" integer NOT NULL, "image_width" integer NOT NULL, "md5" text NOT NULL, "source" text NOT NULL, "file_name" text NOT NULL, "status" "public"."post_replacements_status_enum" NOT NULL, "reason" text NOT NULL, "label_id" text, CONSTRAINT "REL_61c67b0ddfde13edecd4d2ea43" UNIQUE ("label_id"), CONSTRAINT "PK_bd286f189bed06b649cdb1a6571" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" integer NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "label_id" text, CONSTRAINT "REL_c46e2ccc7cf6b846f4c45aa8e7" UNIQUE ("label_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notable_users_type_enum" AS ENUM('staff', 'reporter', 'uploader')`);
        await queryRunner.query(`CREATE TABLE "notable_users" ("id" integer NOT NULL, "type" "public"."notable_users_type_enum" NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0369313cd7cda51d3e818f75dcf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."post_versions_rating_enum" AS ENUM('s', 'q', 'e')`);
        await queryRunner.query(`CREATE TABLE "post_versions" ("id" integer NOT NULL, "post_id" integer NOT NULL, "description" text NOT NULL, "description_changed" boolean NOT NULL, "rating" "public"."post_versions_rating_enum" NOT NULL, "rating_changed" boolean NOT NULL, "source" text NOT NULL, "source_changed" boolean NOT NULL, "parent_id" integer, "parent_changed" boolean NOT NULL, "reason" text, "added_locked_tags" json, "added_tags" json, "locked_tags" text, "obsolete_added_tags" text, "obsolete_removed_tags" text, "removed_locked_tags" json, "removed_tags" json, "tags" text, "unchanged_tags" text, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updater_id" integer NOT NULL, "updater_name" text NOT NULL, "version" integer NOT NULL, "label_id" text, CONSTRAINT "REL_95579fd9d390af95643694b70f" UNIQUE ("label_id"), CONSTRAINT "PK_fa65826acb5995982e2ae8d0e65" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b0cf1a55ea95844e9b5c0a92c9" ON "post_versions" ("version", "updated_at") `);
        await queryRunner.query(`CREATE TYPE "public"."tickets_qtype_enum" AS ENUM('user', 'comment', 'forum', 'blip', 'wiki', 'pool', 'set', 'post', 'dmail')`);
        await queryRunner.query(`CREATE TYPE "public"."tickets_status_enum" AS ENUM('pending', 'approved', 'partial')`);
        await queryRunner.query(`CREATE TABLE "tickets" ("id" integer NOT NULL, "creator_id" integer NOT NULL, "claimant_id" integer, "handler_id" integer, "accused_id" integer, "disp_id" integer, "qtype" "public"."tickets_qtype_enum" NOT NULL, "reason" text NOT NULL, "report_reason" text, "response" text NOT NULL, "status" "public"."tickets_status_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "label_id" text, CONSTRAINT "REL_8733cf1924636c2be0ef0bffb3" UNIQUE ("label_id"), CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_09a4d6db964c6b6ce11f8f1d92" ON "tickets" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "mod_actions" ("id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "label_id" text, CONSTRAINT "REL_a6fbe4bd234f5cd1ce730f6123" UNIQUE ("label_id"), CONSTRAINT "PK_b1202f6b822249b6fdb595a01db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."posts_rating_enum" AS ENUM('s', 'q', 'e')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "file" text, "preview" text, "sample" text, "extension" text NOT NULL, "rating" "public"."posts_rating_enum" NOT NULL, "favorites" integer NOT NULL, "score" integer NOT NULL, "description" text NOT NULL, "uploader_id" integer NOT NULL, "approver_id" integer, "tags" json NOT NULL, "deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_0d6fb074aee1e66301eefc69f8" UNIQUE ("label_id"), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permits" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "post_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e0f39993461b6ea160b4f42ac1c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dd9ef5a04ed4a0bf79bf3a7219" ON "permits" ("post_id") `);
        await queryRunner.query(`CREATE TYPE "public"."manifests_type_enum" AS ENUM('approvals', 'tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'mod_actions')`);
        await queryRunner.query(`CREATE TABLE "manifests" ("id" SERIAL NOT NULL, "type" "public"."manifests_type_enum" NOT NULL, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "refreshed_at" TIMESTAMP WITH TIME ZONE, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL, CONSTRAINT "PK_fb41b22d800467667616837784b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."flags_type_enum" AS ENUM('flag', 'deletion')`);
        await queryRunner.query(`CREATE TABLE "flags" ("id" integer NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "is_resolved" boolean NOT NULL, "reason" text NOT NULL, "type" "public"."flags_type_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "label_id" text, CONSTRAINT "REL_86d80e82fac1719346cf803a55" UNIQUE ("label_id"), CONSTRAINT "PK_ea7e333c92a55de9e9b8d0b9afd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bf4bf0e8f2e15a2793a541fa57" ON "flags" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6741cc908e9aa39e5e5c3f8b7" ON "flags" ("created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."dashboards_type_enum" AS ENUM('moderator', 'janitor', 'admin')`);
        await queryRunner.query(`CREATE TABLE "dashboards" ("type" "public"."dashboards_type_enum" NOT NULL, "user_id" integer NOT NULL, "version" integer NOT NULL DEFAULT '1', "positions" json NOT NULL, "meta" json NOT NULL, CONSTRAINT "PK_e3c73b35fa00a6319d3187c6a0b" PRIMARY KEY ("type", "user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."feedbacks_category_enum" AS ENUM('negative', 'positive', 'neutral')`);
        await queryRunner.query(`CREATE TABLE "feedbacks" ("id" integer NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "body" text NOT NULL, "category" "public"."feedbacks_category_enum" NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "label_id" text, CONSTRAINT "REL_4f2b5536c790b9078cc269e07d" UNIQUE ("label_id"), CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "approvals" ("id" integer NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "label_id" text, CONSTRAINT "REL_6ec666fa54dc79a0f4c695c217" UNIQUE ("label_id"), CONSTRAINT "PK_690417aaefa84d18b1a59e2a499" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2565bad45a3e088f09587b63d6" ON "approvals" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8f36a17c106cce6b46cb193cb4" ON "approvals" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "user_profiles" ("id" integer NOT NULL, "name" text NOT NULL, "level" integer NOT NULL, "level_string" text NOT NULL, "is_banned" boolean NOT NULL, "avatar_id" integer, "base_upload_limit" integer NOT NULL, "can_approve_posts" boolean NOT NULL, "can_upload_free" boolean NOT NULL, "artist_version_count" integer, "comment_count" integer, "favorite_count" integer, "flag_count" integer, "forum_post_count" integer, "note_update_count" integer NOT NULL, "pool_version_count" integer, "negative_feedback_count" integer, "neutral_feedback_count" integer, "positive_feedback_count" integer, "post_update_count" integer NOT NULL, "post_upload_count" integer NOT NULL, "upload_limit" integer, "wiki_page_version_count" integer, "profile_about" text, "profile_artinfo" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "label_id" text, CONSTRAINT "REL_5e1f6f4f9109311910c7f646f7" UNIQUE ("label_id"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "post_replacements" ADD CONSTRAINT "FK_61c67b0ddfde13edecd4d2ea433" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c46e2ccc7cf6b846f4c45aa8e79" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_versions" ADD CONSTRAINT "FK_95579fd9d390af95643694b70f5" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_8733cf1924636c2be0ef0bffb37" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mod_actions" ADD CONSTRAINT "FK_a6fbe4bd234f5cd1ce730f61235" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_0d6fb074aee1e66301eefc69f81" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flags" ADD CONSTRAINT "FK_86d80e82fac1719346cf803a550" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_4f2b5536c790b9078cc269e07d5" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approvals" ADD CONSTRAINT "FK_6ec666fa54dc79a0f4c695c2176" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_5e1f6f4f9109311910c7f646f7c" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_5e1f6f4f9109311910c7f646f7c"`);
        await queryRunner.query(`ALTER TABLE "approvals" DROP CONSTRAINT "FK_6ec666fa54dc79a0f4c695c2176"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_4f2b5536c790b9078cc269e07d5"`);
        await queryRunner.query(`ALTER TABLE "flags" DROP CONSTRAINT "FK_86d80e82fac1719346cf803a550"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_0d6fb074aee1e66301eefc69f81"`);
        await queryRunner.query(`ALTER TABLE "mod_actions" DROP CONSTRAINT "FK_a6fbe4bd234f5cd1ce730f61235"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_8733cf1924636c2be0ef0bffb37"`);
        await queryRunner.query(`ALTER TABLE "post_versions" DROP CONSTRAINT "FK_95579fd9d390af95643694b70f5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c46e2ccc7cf6b846f4c45aa8e79"`);
        await queryRunner.query(`ALTER TABLE "post_replacements" DROP CONSTRAINT "FK_61c67b0ddfde13edecd4d2ea433"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f36a17c106cce6b46cb193cb4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2565bad45a3e088f09587b63d6"`);
        await queryRunner.query(`DROP TABLE "approvals"`);
        await queryRunner.query(`DROP TABLE "feedbacks"`);
        await queryRunner.query(`DROP TYPE "public"."feedbacks_category_enum"`);
        await queryRunner.query(`DROP TABLE "dashboards"`);
        await queryRunner.query(`DROP TYPE "public"."dashboards_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6741cc908e9aa39e5e5c3f8b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf4bf0e8f2e15a2793a541fa57"`);
        await queryRunner.query(`DROP TABLE "flags"`);
        await queryRunner.query(`DROP TYPE "public"."flags_type_enum"`);
        await queryRunner.query(`DROP TABLE "manifests"`);
        await queryRunner.query(`DROP TYPE "public"."manifests_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd9ef5a04ed4a0bf79bf3a7219"`);
        await queryRunner.query(`DROP TABLE "permits"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_rating_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72cdf4b302dcf3097dd04854bd"`);
        await queryRunner.query(`DROP TABLE "mod_actions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09a4d6db964c6b6ce11f8f1d92"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12b901b34113688b4786368510"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
        await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tickets_qtype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0cf1a55ea95844e9b5c0a92c9"`);
        await queryRunner.query(`DROP TABLE "post_versions"`);
        await queryRunner.query(`DROP TYPE "public"."post_versions_rating_enum"`);
        await queryRunner.query(`DROP TABLE "notable_users"`);
        await queryRunner.query(`DROP TYPE "public"."notable_users_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "post_replacements"`);
        await queryRunner.query(`DROP TYPE "public"."post_replacements_status_enum"`);
        await queryRunner.query(`DROP TABLE "labels"`);
    }

}
