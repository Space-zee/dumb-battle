import { Injectable, Logger } from '@nestjs/common';
import { UserEntity } from '../../../db/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { IGetActiveRoomsRes } from './interfaces';
import { RoomEntity } from '../../../db/entities/room.entity';
import { RoomStatus } from './enums';
import { formatEther } from 'ethers/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { ICreateLobbyReq, ICreateLobbyRes } from '../gateway/interfaces';
import { TransactionEntity } from '../../../db/entities/transaction.entity';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);
  private readonly url = `https://scroll-sepolia.blockpi.network/v1/rpc/64e6310d6e6234d8d05d9afcdc60a5ddab5a05a9`;
  private provider: ethers.providers.JsonRpcProvider;

  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(this.url);
  }

  public async getBattles(): Promise<IGetActiveRoomsRes[]> {
    const roomEntity = await this.roomRepository.find({
      relations: ['gameCreatorUser'],
      where: { status: RoomStatus.Active },
    });

    return roomEntity.map((el) => {
      return {
        bet: el.bet,
        roomId: el.roomId,
        creatorId: Number(el.gameCreatorUser.telegramUserId),
        username: el.gameCreatorUser.username ? el.gameCreatorUser.username : 'Rand',
      };
    });
  }

  public async getWallet(telegramUserId: string): Promise<{ wallet: string; balance: string }> {
    const userEntity = await this.userRepository.findOne({
      where: { telegramUserId },
      relations: { wallets: true },
    });
    const balance = await this.provider.getBalance(userEntity.wallets[0].address);

    return {
      balance: formatEther(balance),
      wallet: userEntity.wallets[0].address,
    };
  }

  public async createGame(telegramUserId: string, data: ICreateLobbyReq): Promise<ICreateLobbyRes> {
    try {
      const user = await this.userRepository.findOne({
        where: { telegramUserId },
      });
      const roomEntity = this.roomRepository.create({
        roomId: uuidv4(),
        status: RoomStatus.Active,
        gameCreatorUserId: user.id,
        bet: data.bet,
      });
      await this.roomRepository.save(roomEntity);

      return {
        bet: data.bet,
        roomId: roomEntity.roomId,
      };
    } catch (e) {
      this.logger.error(`createGame error | ${e}`);
    }
  }
}
