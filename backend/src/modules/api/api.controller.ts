import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { IGetActiveRoomsRes } from './interfaces';
import { ICreateLobbyReq, ICreateLobbyRes } from '../gateway/interfaces';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parseJwt } from '../../shared/utils/parseJwt';

@Controller()
//@UseGuards(JwtAuthGuard)
export class ApiController {
  private readonly logger = new Logger(ApiService.name);
  constructor(private readonly apiService: ApiService) {}

  @Get('getActiveGames')
  public async getActiveGames(): Promise<IGetActiveRoomsRes[]> {
    try {
      this.logger.log('getActiveGames call');

      return await this.apiService.getBattles();
    } catch (e) {
      this.logger.error(`api getActiveRooms error | ${e}`);
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
    @Query() query: any,
    @Req() request: Request,
  ): Promise<{ wallet: string; balance: string }> {
    const jwtData = parseJwt(request.headers['authorization']);
    console.log('jwtData', jwtData);
    try {
      this.logger.log('getUserWallet call');

      return await this.apiService.getWallet(query.telegramUserId);
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

  @Post('createGame')
  public async createGame(
    @Body() payload: ICreateLobbyReq,
    @Req() request: Request,
  ): Promise<ICreateLobbyRes> {
    try {
      this.logger.log('createGames call');

      const jwtData = parseJwt(request.headers['authorization']);
      console.log('jwtData', jwtData);

      return await this.apiService.createGame(jwtData.telegramUserId, payload);
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
}
