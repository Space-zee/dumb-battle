import { Injectable, Logger } from '@nestjs/common';
import { UserEntity } from '../../../db/entities/user.entity';
import { Repository } from 'typeorm';
import { IGameResultStep, IGetActiveRoomsRes, ILoadGameData } from './interfaces';
import { RoomEntity } from '../../../db/entities/room.entity';
import { RoomStatus } from './enums';
import { formatEther } from 'ethers/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { ICreateLobbyReq, ICreateLobbyRes } from '../gateway/interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { ProviderService } from '../provider/provider.service';
import { getBattleshipContractWithProvider } from '../../shared/utils/getBattleshipContract';
import { TransactionEntity } from '../../../db/entities/transaction.entity';
import { TransactionTypeEnum } from '../../shared/enum/operation.enum';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);

  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    private readonly providerService: ProviderService,
  ) {}

  public async getBattles(telegramUserId: string): Promise<IGetActiveRoomsRes[]> {
    const user = await this.userRepository.findOne({ where: { telegramUserId } });

    const roomsEntity = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.gameCreatorUser', 'gameCreatorUser')
      .where('room.status IN (:...statuses)', {
        statuses: [RoomStatus.Active, RoomStatus.WaitingGameJoin],
      })
      .andWhere('room.gameCreatorUserId != :userId', { userId: user.id })
      .getMany();

    const myRooms = await this.roomRepository.find({
      relations: ['gameCreatorUser', 'joinUser'],
      where: [
        { status: RoomStatus.Game, gameCreatorUserId: user.id },
        { status: RoomStatus.Game, joinUserId: user.id },
        { status: RoomStatus.Active, gameCreatorUserId: user.id },
        { status: RoomStatus.Active, joinUserId: user.id },
        { status: RoomStatus.WaitingGameJoin, gameCreatorUserId: user.id },
        { status: RoomStatus.WaitingGameJoin, joinUserId: user.id },
      ],
    });
    const rooms = [...myRooms, ...roomsEntity];

    return rooms.map((el) => {
      return {
        status: el.status as RoomStatus,
        bet: el.bet,
        roomId: el.roomId,
        creator: {
          username: el.gameCreatorUser.username ? el.gameCreatorUser.username : 'A',
          photo: el.gameCreatorUser.photo,
          telegramUserId: Number(el.gameCreatorUser.telegramUserId),
        },
        joiner: {
          username: el?.joinUser?.username ? el?.joinUser?.username : 'A',
          photo: el?.joinUser?.photo,
          telegramUserId: Number(el?.joinUser?.telegramUserId),
        },
      };
    });
  }

  public async getWallet(telegramUserId: string): Promise<{ wallet: string; balance: string }> {
    const userEntity = await this.userRepository.findOne({
      where: { telegramUserId },
      relations: { wallets: true },
    });
    const balance = await this.providerService.provider.getBalance(userEntity.wallets[0].address);

    return {
      balance: formatEther(balance),
      wallet: userEntity.wallets[0].address,
    };
  }

  public async getGameData(telegramUserId: string, roomId: string): Promise<ILoadGameData> {
    const userEntity = await this.userRepository.findOne({
      where: { telegramUserId },
      relations: { wallets: true },
    });
    const roomEntity = await this.roomRepository.findOne({
      where: { roomId },
      relations: { gameCreatorUser: true, joinUser: true },
    });

    const contract = getBattleshipContractWithProvider(this.providerService.provider);
    const gameState = await contract.game(roomEntity.contractRoomId);

    const userAddress = userEntity.wallets[0].address;
    const isUserGameCreator = gameState.player1.toLowerCase() === userAddress.toLowerCase();

    const creatorSteps = [];
    const joinerSteps = [];

    for (let i = 0; i < gameState.moves.length; i++) {
      const move = gameState.moves[i];
      const moveData = {
        x: move.x.toNumber(),
        y: move.y.toNumber(),
        isHit: i === gameState.moves.length - 1 ? undefined : move.isHit,
      };
      if (i % 2 === 0) {
        creatorSteps.push(moveData);
      } else {
        joinerSteps.push(moveData);
      }
    }

    return {
      isScCreated: typeof roomEntity.contractRoomId === 'number',
      bet: roomEntity.bet,
      gameId: roomEntity.id,
      isCreator: isUserGameCreator,
      isUserTurn: isUserGameCreator
        ? gameState.moves.length % 2 === 0
        : gameState.moves.length % 2 === 1,
      moveDeadline: Number(roomEntity.moveDeadline),
      opponentName: isUserGameCreator
        ? roomEntity.joinUser.username
        : roomEntity.gameCreatorUser.username,
      opponentSteps: !isUserGameCreator ? creatorSteps : joinerSteps,
      userSteps: isUserGameCreator ? creatorSteps : joinerSteps,
    };
  }

  public async getGameResult(
    roomId: string,
  ): Promise<{ steps: IGameResultStep[]; winnerAddress: string }> {
    const roomEntity = await this.roomRepository.findOne({
      where: { roomId },
      relations: { gameCreatorUser: true, joinUser: true },
    });

    const txs = (
      await this.transactionRepository.find({
        where: { roomId: roomEntity.id },
        relations: { user: true },
      })
    ).filter(
      (el) => el.type === TransactionTypeEnum.Move || el.type === TransactionTypeEnum.ClaimReward,
    );

    const contract = getBattleshipContractWithProvider(this.providerService.provider);
    const gameState = await contract.game(roomEntity.contractRoomId);

    const steps = [];

    for (let i = 0; i < gameState.moves.length; i++) {
      const move = gameState.moves[i];
      const moveData: IGameResultStep = {
        x: move.x.toNumber(),
        y: move.y.toNumber(),
        isHit: move.isHit,
        hash: txs[i].hash,
        telegramUserId: Number(txs[i].user.telegramUserId),
        username: txs[i].user.username,
      };
      steps.push(moveData);
    }

    return { steps, winnerAddress: gameState.winner };
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

  public async deleteGame(roomId: string): Promise<void> {
    try {
      const roomEntity = await this.roomRepository.findOne({ where: { roomId } });
      if (roomEntity.status === RoomStatus.Active) {
        await this.roomRepository.update({ roomId }, { status: RoomStatus.Deleted });
      }
    } catch (e) {
      this.logger.error(`deleteGame error | ${e}`);
    }
  }
}
