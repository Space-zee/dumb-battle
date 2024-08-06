import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { IGameResultStep, IGetActiveRoomsRes, ILoadGameData } from './interfaces';
import { ICreateLobbyReq, ICreateLobbyRes } from '../gateway/interfaces';
import { parseJwt } from '../../shared/utils/parseJwt';

@Controller()
//@UseGuards(JwtAuthGuard)
export class ApiController {
  private readonly logger = new Logger(ApiService.name);
  constructor(private readonly apiService: ApiService) {}

  @Get('getActiveGames')
  public async getActiveGames(@Req() request: Request): Promise<IGetActiveRoomsRes[]> {
    const jwtData = parseJwt(request.headers['authorization']);
    try {
      this.logger.log('getActiveGames call');

      return await this.apiService.getBattles(jwtData.telegramUserId.toString());
    } catch (e) {
      this.logger.error(`api getActiveGames error | ${e}`);
      const status = e?.response?.status ? e.response.status : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          status: status,
          error: e?.response?.error
            ? e.response.error
            : 'There was a problem processing your request',
        },
        status,
      );
    }
  }

  @Get('getUserWallet')
  public async getUserWallet(
    @Req() request: Request,
  ): Promise<{ wallet: string; balance: string }> {
    const jwtData = parseJwt(request.headers['authorization']);
    try {
      this.logger.log('getUserWallet call');

      return await this.apiService.getWallet(jwtData.telegramUserId.toString());
    } catch (e) {
      this.logger.error(`api getUserWallet error | ${e}`);
      const status = e?.response?.status ? e.response.status : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          status: status,
          error: e?.response?.error
            ? e.response.error
            : 'There was a problem processing your request',
        },
        status,
      );
    }
  }

  @Get('getGameData/:roomId')
  public async getGameData(
    @Param() params: { roomId: string },
    @Req() request: Request,
  ): Promise<ILoadGameData> {
    const jwtData = parseJwt(request.headers['authorization']);
    try {
      this.logger.log('getGameData call');

      return await this.apiService.getGameData(jwtData.telegramUserId.toString(), params.roomId);
    } catch (e) {
      this.logger.error(`api getGameData error | ${e}`);
      const status = e?.response?.status ? e.response.status : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          status: status,
          error: e?.response?.error
            ? e.response.error
            : 'There was a problem processing your request',
        },
        status,
      );
    }
  }

  @Get('getGameResult/:roomId')
  public async getGameResult(
    @Param() params: { roomId: string },
  ): Promise<{ steps: IGameResultStep[] }> {
    try {
      this.logger.log('getGameResults call');

      return await this.apiService.getGameResult(params.roomId);
    } catch (e) {
      this.logger.error(`api getGameResults error | ${e}`);
      const status = e?.response?.status ? e.response.status : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          status: status,
          error: e?.response?.error
            ? e.response.error
            : 'There was a problem processing your request',
        },
        status,
      );
    }
  }

  @Post('createGame')
  public async createGame(
    @Body() payload: ICreateLobbyReq,
    @Req() request: Request,
  ): Promise<ICreateLobbyRes> {
    try {
      this.logger.log('createGames call');

      const jwtData = parseJwt(request.headers['authorization']);

      return await this.apiService.createGame(jwtData.telegramUserId.toString(), payload);
    } catch (e) {
      this.logger.error(`api createGames error | ${e}`);
      const status = e?.response?.status ? e.response.status : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          status: status,
          error: e?.response?.error
            ? e.response.error
            : 'There was a problem processing your request',
        },
        status,
      );
    }
  }

  @Post('deleteGame')
  public async deleteGame(@Body() payload: { roomId: string }): Promise<void> {
    try {
      this.logger.log('deleteGame call');

      return await this.apiService.deleteGame(payload.roomId);
    } catch (e) {
      this.logger.error(`api deleteGame error | ${e}`);
      const status = e?.response?.status ? e.response.status : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          status: status,
          error: e?.response?.error
            ? e.response.error
            : 'There was a problem processing your request',
        },
        status,
      );
    }
  }
}
