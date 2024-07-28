import { Injectable, Logger } from '@nestjs/common';
import { UserEntity } from '../../../db/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IResponse } from '../../shared/interfaces/response.interface';
import { WalletEntity } from '../../../db/entities/wallet.entity';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly encryptionKey: string;
  private readonly encryptionAlgorithm = 'aes-256-cbc';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get('ENCRYPTION_KEY');
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    console.log('this.encryptionKey', this.encryptionKey);
    const cipher = crypto.createCipheriv(
      this.encryptionAlgorithm,
      Buffer.from(this.encryptionKey),
      iv,
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      this.encryptionAlgorithm,
      Buffer.from(this.encryptionKey),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }

  public async createUser(
    telegramUserId: number,
    firstName: string,
    username: string,
  ): Promise<IResponse<{ wallet: WalletEntity }>> {
    console.log(telegramUserId);
    this.logger.log(`createUser | ${telegramUserId}`);
    try {
      let userEntity = await this.userRepository.findOne({
        where: { telegramUserId },
        relations: { wallets: true },
      });
      if (!userEntity) {
        userEntity = this.userRepository.create({
          telegramUserId,
          firstName,
          username,
          nonce: Math.floor(Math.random() * 90000) + 10000,
        });
        await userEntity.save();
      }
      console.log('userEntityBefore', userEntity);
      const userEntityA = await this.userRepository.findOne({
        where: { telegramUserId },
        relations: { wallets: true },
      });
      console.log('userEntityA', userEntityA);

      return {
        success: true,
        data: {
          wallet: userEntity.wallets && userEntity.wallets[0],
        },
      };
    } catch (e) {
      this.logger.error(`createUser error | ${e}`);

      return {
        success: false,
      };
    }
  }

  public async createWallet(
    telegramUserId: number,
  ): Promise<IResponse<{ address: string; privateKey: string }>> {
    const userEntity = await this.userRepository.findOne({
      where: { telegramUserId },
      relations: { wallets: true },
    });

    if (!userEntity) {
      this.logger.error('createWallet | no user entity');

      return {
        success: false,
        error: 'Please click /start',
      };
    }
    if (userEntity.wallets.length) {
      this.logger.error('createWallet | wallet exist');

      return {
        success: true,
        data: {
          address: userEntity.wallets[0].address,
          privateKey: this.decrypt(userEntity.wallets[0].privateKey),
        },
      };
    }
    const wallet = ethers.Wallet.createRandom();

    const encryptedPrivateKey = this.encrypt(wallet.privateKey);

    const walletEntity = this.walletRepository.create({
      address: wallet.address,
      userId: userEntity.id,
      privateKey: encryptedPrivateKey,
    });
    await walletEntity.save();

    return {
      success: true,
      data: {
        address: wallet.address,
        privateKey: wallet.privateKey,
      },
    };
  }
}
