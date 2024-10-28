import { MigrationInterface, QueryRunner } from 'typeorm';

export class Feedbacks1727908987486 implements MigrationInterface {
  name = 'Feedbacks1727908987486';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feedbacks" ("id" integer PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "body" text NOT NULL, "category" varchar CHECK( "category" IN ('negative','positive','neutral') ) NOT NULL, "updated_at" datetime NOT NULL, "updater_id" integer NOT NULL, "is_deleted" boolean NOT NULL, "cache_id" text, CONSTRAINT "REL_c0680aca0d4ffd84a9311d657a" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id" FROM "manifests"`,
    );
    await queryRunner.query(`DROP TABLE "manifests"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_manifests" RENAME TO "manifests"`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(
      `ALTER TABLE "manifests" RENAME TO "temporary_manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id" FROM "temporary_manifests"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_manifests"`);
    await queryRunner.query(`DROP TABLE "feedbacks"`);
  }
}
