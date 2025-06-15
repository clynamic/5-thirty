import { MigrationInterface, QueryRunner } from "typeorm";

export class PostFlagNotes1750013402516 implements MigrationInterface {
    name = 'PostFlagNotes1750013402516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flags" ADD "note" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flags" DROP COLUMN "note"`);
    }

}
