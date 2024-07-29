import { MigrationInterface, QueryRunner } from "typeorm";

export class First1722264361340 implements MigrationInterface {
    name = 'First1722264361340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`Wallet\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`address\` varchar(42) NOT NULL, \`privateKey\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Room\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`roomId\` varchar(255) NOT NULL, \`contractRoomId\` int NULL, \`status\` varchar(255) NOT NULL, \`bet\` varchar(255) NOT NULL, \`createdAt\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`User\` (\`id\` int NOT NULL AUTO_INCREMENT, \`telegramUserId\` bigint NOT NULL, \`firstName\` varchar(50) CHARACTER SET "utf8" NULL, \`username\` varchar(255) NOT NULL, \`nonce\` int NOT NULL, \`createdAt\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE INDEX \`IDX_4d04b2d151dfcca0292ea9b463\` (\`telegramUserId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`Wallet\` ADD CONSTRAINT \`FK_2f7aa51d6746fc8fc8ed63ddfbc\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Room\` ADD CONSTRAINT \`FK_a833df0caf1aadb8676e11bca59\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`Room\` DROP FOREIGN KEY \`FK_a833df0caf1aadb8676e11bca59\``);
        await queryRunner.query(`ALTER TABLE \`Wallet\` DROP FOREIGN KEY \`FK_2f7aa51d6746fc8fc8ed63ddfbc\``);
        await queryRunner.query(`DROP INDEX \`IDX_4d04b2d151dfcca0292ea9b463\` ON \`User\``);
        await queryRunner.query(`DROP TABLE \`User\``);
        await queryRunner.query(`DROP TABLE \`Room\``);
        await queryRunner.query(`DROP TABLE \`Wallet\``);
    }

}
