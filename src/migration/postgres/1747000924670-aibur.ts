import { MigrationInterface, QueryRunner } from "typeorm";

export class Aibur1747000924670 implements MigrationInterface {
    name = 'Aibur1747000924670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tag_aliases_status_enum" AS ENUM('approved', 'active', 'pending', 'deleted', 'retired', 'processing', 'queued')`);
        await queryRunner.query(`CREATE TABLE "tag_aliases" ("id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "creator_id" integer NOT NULL, "approver_id" integer, "antecedent_name" text NOT NULL, "consequent_name" text NOT NULL, "forum_post_id" integer, "forum_topic_id" integer, "post_count" integer, "reason" text, "status" "public"."tag_aliases_status_enum" NOT NULL, "label_id" text, CONSTRAINT "REL_9fc776e42d04de84a939471cb2" UNIQUE ("label_id"), CONSTRAINT "PK_84d1347dcf0a8d46d91180295f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tag_implications_status_enum" AS ENUM('approved', 'active', 'pending', 'deleted', 'retired', 'processing', 'queued')`);
        await queryRunner.query(`CREATE TABLE "tag_implications" ("id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "creator_id" integer NOT NULL, "approver_id" integer, "antecedent_name" text NOT NULL, "consequent_name" text NOT NULL, "descendant_names" text, "forum_post_id" integer, "forum_topic_id" integer, "reason" text, "status" "public"."tag_implications_status_enum" NOT NULL, "label_id" text, CONSTRAINT "REL_68957222a84fff132775153100" UNIQUE ("label_id"), CONSTRAINT "PK_21188d4688fff8b3c42c823d423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bulk_update_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "bulk_update_requests" ("id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" integer NOT NULL, "approver_id" integer, "forum_topic_id" integer, "forum_post_id" integer, "title" text NOT NULL, "script" text NOT NULL, "status" "public"."bulk_update_requests_status_enum" NOT NULL, "label_id" text, CONSTRAINT "REL_2830e51cd4a7f28e09e98162bf" UNIQUE ("label_id"), CONSTRAINT "PK_80defa64800adc78bce5b826a79" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."manifests_type_enum" RENAME TO "manifests_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."manifests_type_enum" AS ENUM('approvals', 'tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'mod_actions', 'bulk_update_requests', 'tag_aliases', 'tag_implications')`);
        await queryRunner.query(`ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum" USING "type"::"text"::"public"."manifests_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."manifests_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tag_aliases" ADD CONSTRAINT "FK_9fc776e42d04de84a939471cb25" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_implications" ADD CONSTRAINT "FK_68957222a84fff132775153100f" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_update_requests" ADD CONSTRAINT "FK_2830e51cd4a7f28e09e98162bf1" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bulk_update_requests" DROP CONSTRAINT "FK_2830e51cd4a7f28e09e98162bf1"`);
        await queryRunner.query(`ALTER TABLE "tag_implications" DROP CONSTRAINT "FK_68957222a84fff132775153100f"`);
        await queryRunner.query(`ALTER TABLE "tag_aliases" DROP CONSTRAINT "FK_9fc776e42d04de84a939471cb25"`);
        await queryRunner.query(`CREATE TYPE "public"."manifests_type_enum_old" AS ENUM('approvals', 'tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'mod_actions')`);
        await queryRunner.query(`ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum_old" USING "type"::"text"::"public"."manifests_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."manifests_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."manifests_type_enum_old" RENAME TO "manifests_type_enum"`);
        await queryRunner.query(`DROP TABLE "bulk_update_requests"`);
        await queryRunner.query(`DROP TYPE "public"."bulk_update_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "tag_implications"`);
        await queryRunner.query(`DROP TYPE "public"."tag_implications_status_enum"`);
        await queryRunner.query(`DROP TABLE "tag_aliases"`);
        await queryRunner.query(`DROP TYPE "public"."tag_aliases_status_enum"`);
    }

}
