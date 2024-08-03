import { MigrationInterface, QueryRunner } from "typeorm";

export class Photo1722725224023 implements MigrationInterface {
    name = 'Photo1722725224023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`User\` ADD \`photo\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`User\` DROP COLUMN \`photo\``);
    }

}
