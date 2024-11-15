import { MigrationInterface, QueryRunner } from "typeorm";

export class NotableUploaders1731689297033 implements MigrationInterface {
    name = 'NotableUploaders1731689297033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_notable_users" ("id" integer PRIMARY KEY NOT NULL, "type" varchar NOT NULL, "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_notable_users"("id", "type", "updated_at") SELECT "id", "type", "updated_at" FROM "notable_users"`);
        await queryRunner.query(`DROP TABLE "notable_users"`);
        await queryRunner.query(`ALTER TABLE "temporary_notable_users" RENAME TO "notable_users"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notable_users" RENAME TO "temporary_notable_users"`);
        await queryRunner.query(`CREATE TABLE "notable_users" ("id" integer PRIMARY KEY NOT NULL, "type" varchar NOT NULL, "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "notable_users"("id", "type", "updated_at") SELECT "id", "type", "updated_at" FROM "temporary_notable_users"`);
        await queryRunner.query(`DROP TABLE "temporary_notable_users"`);
    }

}
