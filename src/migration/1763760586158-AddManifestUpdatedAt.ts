import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManifestUpdatedAt1763760586158 implements MigrationInterface {
  name = 'AddManifestUpdatedAt1763760586158';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "manifests" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "manifests" DROP COLUMN "updated_at"`);
  }
}
