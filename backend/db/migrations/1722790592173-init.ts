import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1722790592173 implements MigrationInterface {
    name = 'Init1722790592173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`Room\` (\`id\` int NOT NULL AUTO_INCREMENT, \`gameCreatorUserId\` int NOT NULL, \`joinUserId\` int NULL, \`roomId\` varchar(255) NOT NULL, \`contractRoomId\` int NULL, \`status\` varchar(255) NOT NULL, \`bet\` varchar(255) NOT NULL, \`moveDeadline\` bigint NULL, \`createdAt\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`User\` (\`id\` int NOT NULL AUTO_INCREMENT, \`telegramUserId\` bigint NOT NULL, \`firstName\` varchar(50) CHARACTER SET "utf8" NULL, \`username\` varchar(255) NOT NULL, \`photo\` text NULL, \`nonce\` int NOT NULL, \`win\` int NOT NULL DEFAULT '0', \`lose\` int NOT NULL DEFAULT '0', \`createdAt\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE INDEX \`IDX_4d04b2d151dfcca0292ea9b463\` (\`telegramUserId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Wallet\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`address\` varchar(42) NOT NULL, \`privateKey\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Transaction\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`roomId\` int NOT NULL, \`hash\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`createdAt\` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`Room\` ADD CONSTRAINT \`FK_06600fb9206931818da83813115\` FOREIGN KEY (\`gameCreatorUserId\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Room\` ADD CONSTRAINT \`FK_855a5baed52c96c9fd005e5d87a\` FOREIGN KEY (\`joinUserId\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Wallet\` ADD CONSTRAINT \`FK_2f7aa51d6746fc8fc8ed63ddfbc\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Transaction\` ADD CONSTRAINT \`FK_32a6e4065ab9d7275321271d3ae\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`Transaction\` ADD CONSTRAINT \`FK_34156ff960c6a80a2f41781f820\` FOREIGN KEY (\`roomId\`) REFERENCES \`Room\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`Transaction\` DROP FOREIGN KEY \`FK_34156ff960c6a80a2f41781f820\``);
        await queryRunner.query(`ALTER TABLE \`Transaction\` DROP FOREIGN KEY \`FK_32a6e4065ab9d7275321271d3ae\``);
        await queryRunner.query(`ALTER TABLE \`Wallet\` DROP FOREIGN KEY \`FK_2f7aa51d6746fc8fc8ed63ddfbc\``);
        await queryRunner.query(`ALTER TABLE \`Room\` DROP FOREIGN KEY \`FK_855a5baed52c96c9fd005e5d87a\``);
        await queryRunner.query(`ALTER TABLE \`Room\` DROP FOREIGN KEY \`FK_06600fb9206931818da83813115\``);
        await queryRunner.query(`DROP TABLE \`Transaction\``);
        await queryRunner.query(`DROP TABLE \`Wallet\``);
        await queryRunner.query(`DROP INDEX \`IDX_4d04b2d151dfcca0292ea9b463\` ON \`User\``);
        await queryRunner.query(`DROP TABLE \`User\``);
        await queryRunner.query(`DROP TABLE \`Room\``);
    }

}
