import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../db/entities/user.entity';
import { Repository } from 'typeorm';
import { BigNumber, ethers } from 'ethers';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomEntity } from '../../../db/entities/room.entity';
import { RoomStatus } from '../api/enums';
import {
  IJoinRoomReq,
  IJoinRoomRes,
  IRabbitsSetReq,
  IReadyForBattle,
  IUserMoveReq,
} from './interfaces';
import { getBattleshipContract } from '../../shared/utils/getBattleshipContract';
import fs from 'fs';
import * as path from 'path';
import { parseEther } from 'ethers/lib/utils';
import abi from '../../abi/bunBattle.json';
import { SocketEvents } from './enums';
import * as snarkJS from 'snarkjs';
import bigInt from 'big-integer';
import { emptyProof } from '../../shared/constants/emptyProof.const';
import { checkIsHit } from '../../shared/utils/checkIsHit';
import { WsJwtAuthGuard } from '../auth/ws-jwt-auth.guard';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const createWC = require('../../../assets/circom/board/board_js/witness_calculator.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const moveWC = require('../../../assets/circom/move/move_js/witness_calculator.js');

// const createWasm = path.resolve(__dirname, '../../../assets/circom/board/board_js/board.wasm');
// const createZkey = path.resolve(__dirname, '../../../assets/circom/board/board_0001.zkey');
// const moveWasm = path.resolve(__dirname, '../../../assets/circom/move/move_js/move.wasm');
// const moveZkey = path.resolve(__dirname, '../../../assets/circom/move/move_0001.zkey');
//const snarkjs = require('snarkjs');
//const bigInt = require('big-integer');
//const WITNESS_FILE = '/tmp/witness';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class GatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly WITNESS_FILE = '/tmp/witness';
  private readonly createWasm = path.resolve(
    __dirname,
    '../../../assets/circom/board/board_js/board.wasm',
  );

  private readonly createZkey = path.resolve(
    __dirname,
    '../../../assets/circom/board/board_0001.zkey',
  );

  private readonly moveWasm = path.resolve(
    __dirname,
    '../../../assets/circom/move/move_js/move.wasm',
  );

  private readonly moveZkey = path.resolve(__dirname, '../../../assets/circom/move/move_0001.zkey');

  private readonly logger = new Logger(GatewayService.name);
  private readonly url = `https://scroll-sepolia.blockpi.network/v1/rpc/64e6310d6e6234d8d05d9afcdc60a5ddab5a05a9`;
  private provider: ethers.providers.JsonRpcProvider;
  @WebSocketServer()
  private server: Server;

  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly wsJwtAuthGuard: WsJwtAuthGuard,
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(this.url);
  }

  @SubscribeMessage(SocketEvents.JoinRoomClient)
  public async handleJoinRoom(client: Socket, body: IJoinRoomReq): Promise<void> {
    this.logger.log(`${body.telegramUserId} joined room: ${body.roomId}`);

    const roomEntity = await this.roomRepository.findOne({
      where: { roomId: body.roomId },
      relations: { user: true },
    });

    client.join(roomEntity.roomId);

    const user = await this.userRepository.findOne({
      where: { telegramUserId: body.telegramUserId.toString() },
    });

    const room = this.server.sockets.adapter.rooms.get(roomEntity.roomId);
    const numOfPlayers = room ? room.size : 0;

    if (numOfPlayers === 2) {
      const data: IReadyForBattle = {
        gameId: roomEntity.id,
        isGameCreated: !!roomEntity.contractRoomId,
        bet: roomEntity.bet,
        roomId: roomEntity.roomId,
        creatorName: roomEntity.user.username,
        opponentName: user.username,
        roomCreatorId: Number(roomEntity.user.telegramUserId),
      };
      if (roomEntity.status === RoomStatus.Active) {
        await this.roomRepository.update(roomEntity.id, { status: RoomStatus.WaitingBets });
        this.server.emit(`${SocketEvents.ReadyForBattle}:${roomEntity.roomId}`, data);
      }
    } else {
      const data: IJoinRoomRes = {
        gameId: roomEntity.id,
        isGameCreated: !!roomEntity.contractRoomId,
        bet: roomEntity.bet,
        roomId: roomEntity.roomId,
        creatorName: roomEntity.user.username,
        opponentName: user.id !== roomEntity.user.id ? roomEntity.user.username : undefined,
        roomCreatorId: Number(roomEntity.user.telegramUserId),
      };
      this.server.emit(`${SocketEvents.JoinRoomServer}:${roomEntity.roomId}`, data);
    }
  }

  @SubscribeMessage(SocketEvents.ClientRabbitsSet)
  public async handleRabbitSet(client: Socket, body: IRabbitsSetReq): Promise<void> {
    this.logger.log(`${body.telegramUserId} rabbit set room: ${body.roomId}`);
    const roomEntity = await this.roomRepository.findOne({
      where: { roomId: body.roomId },
    });
    const userEntity = await this.userRepository.findOne({
      where: { telegramUserId: body.telegramUserId.toString() },
      relations: { wallets: true },
    });
    const isRoomCreator = roomEntity.userId === userEntity.id;
    const rabbit1 = body.rabbits[0];
    const rabbit2 = body.rabbits[1];
    const playerCreate = {
      nonce: userEntity.nonce,
      bunnies: [
        [rabbit1.x, rabbit1.y],
        [rabbit2.x, rabbit2.y],
      ],
    };
    const proof = await this.genCreateProof(playerCreate);

    const signer = new ethers.Wallet(userEntity.wallets[0].privateKey, this.provider);
    const contract = getBattleshipContract(signer);
    const contractInterface = new ethers.utils.Interface(abi);

    if (isRoomCreator) {
      const createGame = await contract.createGame(
        proof.solidityProof,
        proof.inputs[0],
        parseEther(roomEntity.bet),
        {
          value: parseEther(roomEntity.bet),
        },
      );
      const receipt = await createGame.wait();
      const contractRoomId = contractInterface.parseLog(receipt.events[1]).args[0].toString();
      await this.roomRepository.update(roomEntity.id, { contractRoomId: Number(contractRoomId) });
    } else {
      const joinGame = await contract.joinGame(
        roomEntity.contractRoomId,
        proof.solidityProof,
        proof.inputs[0],
        {
          value: parseEther(roomEntity.bet),
        },
      );
      await joinGame.wait();
    }

    if (!isRoomCreator) {
      this.server.emit(`${SocketEvents.GameStarted}:${body.roomId}`);
      await this.roomRepository.update({ roomId: body.roomId }, { status: RoomStatus.Game });
    } else {
      this.server.emit(`${SocketEvents.GameCreated}:${body.roomId}`);
    }
  }

  @SubscribeMessage(SocketEvents.ClientUserMove)
  public async handleUserMove(client: Socket, body: IUserMoveReq): Promise<void> {
    this.logger.log(`${body.telegramUserId} move room: ${body.roomId}`);
    const userEntity = await this.userRepository.findOne({
      where: { telegramUserId: body.telegramUserId.toString() },
      relations: { wallets: true },
    });
    const roomEntity = await this.roomRepository.findOne({
      where: { roomId: body.roomId },
      relations: { user: true },
    });
    const signer = new ethers.Wallet(userEntity.wallets[0].privateKey, this.provider);
    const contract = getBattleshipContract(signer);
    const game = await contract.game(roomEntity.contractRoomId);

    if (!game.moves.length) {
      const move = await contract.submitMove(
        roomEntity.contractRoomId,
        body.coordinates.x.toString(),
        body.coordinates.y.toString(),
        emptyProof,
        false,
      );
      await move.wait();

      this.server.emit(`${SocketEvents.ServerUserMove}:${body.roomId}`, {
        lastMove: null,
        telegramUserId: body.telegramUserId,
      });
    } else {
      const boardHash =
        Number(roomEntity.user.telegramUserId) === body.telegramUserId
          ? game.player1Hash.toString()
          : game.player2Hash.toString();

      const proof = await this.genMoveProof({
        // Public Inputs
        boardHash: boardHash,
        guess: [game.moves[game.moves.length - 1].x, game.moves[game.moves.length - 1].y],
        // Private Inputs:
        nonce: userEntity.nonce,
        bunnies: [
          [body.userRabbits[0].x, body.userRabbits[0].y],
          [body.userRabbits[1].x, body.userRabbits[1].y],
        ],
      });

      const moveCoordinates = {
        x: game.moves[game.moves.length - 1].x,
        y: game.moves[game.moves.length - 1].y,
      };

      const wasRabbitHit = checkIsHit(
        [
          [body.userRabbits[0].x, body.userRabbits[0].y],
          [body.userRabbits[1].x, body.userRabbits[1].y],
        ],
        moveCoordinates,
      );

      const move = await contract.submitMove(
        roomEntity.contractRoomId,
        body.coordinates.x.toString(),
        body.coordinates.y.toString(),
        proof.solidityProof,
        wasRabbitHit,
        {
          gasLimit: BigNumber.from('600000'),
        },
      );
      await move.wait();
      const gameAfterTx = await contract.game(roomEntity.contractRoomId);
      if (gameAfterTx.winner !== ethers.constants.AddressZero) {
        console.log('winner');
        this.server.emit(`${SocketEvents.Winner}:${body.roomId}`, { address: game.winner });
        await this.roomRepository.update(
          { roomId: roomEntity.roomId },
          { status: RoomStatus.Closed },
        );

        return;
      }
      this.server.emit(`${SocketEvents.ServerUserMove}:${body.roomId}`, {
        lastMove: {
          x: gameAfterTx.moves[gameAfterTx.moves.length - 2].x.toNumber(),
          y: gameAfterTx.moves[gameAfterTx.moves.length - 2].y.toNumber(),
          isHit: gameAfterTx.moves[gameAfterTx.moves.length - 2].isHit,
        },
        telegramUserId: body.telegramUserId,
      });
    }
  }

  @SubscribeMessage(SocketEvents.LeaveRoomClient)
  public async handleLeaveRoom(
    client: Socket,
    body: { roomId: string; telegramUserId: number },
  ): Promise<void> {
    this.logger.log(`${body.telegramUserId} leaved room: ${body.roomId}`);
    client.leave(body.roomId);
    const roomEntity = await this.roomRepository.findOne({
      where: { roomId: body.roomId },
    });

    console.log('roomEntity', roomEntity);
    if (roomEntity.status === RoomStatus.WaitingBets) {
      await this.roomRepository.update(
        { roomId: roomEntity.roomId },
        { status: RoomStatus.Active },
      );
    }

    this.server.emit(`${SocketEvents.LeaveRoomServer}:${body.roomId}`);
  }

  public handleConnection(socket: Socket): void {
    this.logger.log(`Socket connected: ${socket.id}`);
  }

  public handleDisconnect(socket: Socket): void {
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }

  private async genCreateProof(input: any): Promise<{ solidityProof: string; inputs: any }> {
    const buffer = fs.readFileSync(this.createWasm);
    const witnessCalculator = await createWC(buffer);
    const buff = await witnessCalculator.calculateWTNSBin(input);
    // The package methods read from files only, so we just shove it in /tmp/ and hope
    // there is no parallel execution.
    fs.writeFileSync(this.WITNESS_FILE, buff);
    const { proof, publicSignals } = await snarkJS.groth16.prove(
      this.createZkey,
      this.WITNESS_FILE,
    );
    const solidityProof = this.proofToSolidityInput(proof);

    return {
      solidityProof: solidityProof,
      inputs: publicSignals,
    };
  }

  private proofToSolidityInput(proof: any): string {
    const proofs: string[] = [
      proof.pi_a[0],
      proof.pi_a[1],
      proof.pi_b[0][1],
      proof.pi_b[0][0],
      proof.pi_b[1][1],
      proof.pi_b[1][0],
      proof.pi_c[0],
      proof.pi_c[1],
    ];
    const flatProofs = proofs.map((p) => bigInt(p));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return '0x' + flatProofs.map((x) => this.toHex32(x)).join('');
  }

  private toHex32(num: number): string {
    let str = num.toString(16);
    while (str.length < 64) {
      str = '0' + str;
    }

    return str;
  }

  private async genMoveProof(input: any): Promise<{ solidityProof: string; inputs: any }> {
    const buffer = fs.readFileSync(this.moveWasm);
    const witnessCalculator = await moveWC(buffer);
    const buff = await witnessCalculator.calculateWTNSBin(input);
    fs.writeFileSync(this.WITNESS_FILE, buff);
    const { proof, publicSignals } = await snarkJS.groth16.prove(this.moveZkey, this.WITNESS_FILE);
    const solidityProof = this.proofToSolidityInput(proof);

    return {
      solidityProof: solidityProof,
      inputs: publicSignals,
    };
  }
}
