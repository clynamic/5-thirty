import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostEvents1754401358475 implements MigrationInterface {
  name = 'AddPostEvents1754401358475';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."post_events_action_enum" AS ENUM('deleted', 'undeleted', 'approved', 'unapproved', 'flag_created', 'flag_removed', 'favorites_moved', 'favorites_received', 'rating_locked', 'rating_unlocked', 'status_locked', 'status_unlocked', 'note_locked', 'note_unlocked', 'comment_locked', 'comment_unlocked', 'comment_disabled', 'comment_enabled', 'replacement_accepted', 'replacement_rejected', 'replacement_promoted', 'replacement_deleted', 'expunged', 'changed_bg_color', 'replacement_penalty_changed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_events" ("id" integer NOT NULL, "creator_id" integer NOT NULL, "post_id" integer NOT NULL, "action" "public"."post_events_action_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "label_id" text, CONSTRAINT "REL_c1035914ef5589f7039aaa9e98" UNIQUE ("label_id"), CONSTRAINT "PK_5cde663097d87b73cb9d9bc75b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48b516ab6840c3426ab48c38fb" ON "post_events" ("creator_id", "action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4e1a022fec674ff14c799f3b6" ON "post_events" ("action", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."manifests_type_enum" RENAME TO "manifests_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."manifests_type_enum" AS ENUM('approvals', 'tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'post_events', 'mod_actions', 'bulk_update_requests', 'tag_aliases', 'tag_implications')`,
    );
    await queryRunner.query(
      `ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum" USING "type"::"text"::"public"."manifests_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."manifests_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "post_events" ADD CONSTRAINT "FK_c1035914ef5589f7039aaa9e987" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_events" DROP CONSTRAINT "FK_c1035914ef5589f7039aaa9e987"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."manifests_type_enum_old" AS ENUM('approvals', 'tickets', 'posts', 'users', 'user_profiles', 'flags', 'feedbacks', 'post_versions', 'post_replacements', 'mod_actions', 'bulk_update_requests', 'tag_aliases', 'tag_implications')`,
    );
    await queryRunner.query(
      `ALTER TABLE "manifests" ALTER COLUMN "type" TYPE "public"."manifests_type_enum_old" USING "type"::"text"::"public"."manifests_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."manifests_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."manifests_type_enum_old" RENAME TO "manifests_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4e1a022fec674ff14c799f3b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48b516ab6840c3426ab48c38fb"`,
    );
    await queryRunner.query(`DROP TABLE "post_events"`);
    await queryRunner.query(`DROP TYPE "public"."post_events_action_enum"`);
  }
}
