import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModActions1735151833901 implements MigrationInterface {
  name = 'ModActions1735151833901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mod_actions" ("id" integer PRIMARY KEY NOT NULL, "creator_id" integer NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "action" text NOT NULL, "values" json NOT NULL, "cache_id" text, CONSTRAINT "REL_07699e0d1a08ae18b962af9908" UNIQUE ("cache_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72cdf4b302dcf3097dd04854bd" ON "mod_actions" ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions','post_replacements','mod_actions') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL, "refreshed_at" datetime)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at" FROM "manifests"`,
    );
    await queryRunner.query(`DROP TABLE "manifests"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_manifests" RENAME TO "manifests"`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(
      `ALTER TABLE "manifests" RENAME TO "temporary_manifests"`,
    );
    await queryRunner.query(
      `CREATE TABLE "manifests" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar CHECK( "type" IN ('approvals','tickets','posts','users','user_profiles','flags','feedbacks','post_versions','post_replacements') ) NOT NULL, "start_date" datetime NOT NULL, "end_date" datetime NOT NULL, "lower_id" integer NOT NULL, "upper_id" integer NOT NULL, "refreshed_at" datetime)`,
    );
    await queryRunner.query(
      `INSERT INTO "manifests"("id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at") SELECT "id", "type", "start_date", "end_date", "lower_id", "upper_id", "refreshed_at" FROM "temporary_manifests"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_manifests"`);
    await queryRunner.query(`DROP INDEX "IDX_72cdf4b302dcf3097dd04854bd"`);
    await queryRunner.query(`DROP TABLE "mod_actions"`);
  }
}
