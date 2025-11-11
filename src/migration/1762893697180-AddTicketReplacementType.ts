import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketReplacementType1762893697180
  implements MigrationInterface
{
  name = 'AddTicketReplacementType1762893697180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tickets_qtype_enum" RENAME TO "tickets_qtype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_qtype_enum" AS ENUM('user', 'comment', 'forum', 'blip', 'wiki', 'pool', 'set', 'post', 'dmail', 'replacement')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "qtype" TYPE "public"."tickets_qtype_enum" USING "qtype"::"text"::"public"."tickets_qtype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tickets_qtype_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_qtype_enum_old" AS ENUM('user', 'comment', 'forum', 'blip', 'wiki', 'pool', 'set', 'post', 'dmail')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ALTER COLUMN "qtype" TYPE "public"."tickets_qtype_enum_old" USING "qtype"::"text"::"public"."tickets_qtype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tickets_qtype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."tickets_qtype_enum_old" RENAME TO "tickets_qtype_enum"`,
    );
  }
}
