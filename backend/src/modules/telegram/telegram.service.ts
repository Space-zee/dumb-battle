import { Injectable, Logger } from '@nestjs/common';
import { Action, Start, Update } from 'nestjs-telegraf';
import { Context } from '../../shared/interfaces/context.interface';
import { ParseMode } from 'telegraf/typings/core/types/typegram';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { startMsg, webAppMsg } from '../../shared/utils/msg';
import { startUrlGif } from '../../shared/constants/startUrlGif.const';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomEntity } from '../../../db/entities/room.entity';
import { RoomStatus } from '../api/enums';
import { uiUrl } from '../../shared/constants/uiUrl.constant';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import * as axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import imageToBase64 from 'image-to-base64';

@Update()
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly fileBaseUrl = 'https://api.telegram.org/file/bot';
  private readonly bot: Telegraf<any>;

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    private readonly configService: ConfigService
  ) {
    this.bot = new Telegraf(this.configService.get<string>('TELEGRAM_BOT_TOKEN'));
  }

  @Start()
  async startCommand(ctx: Context) {
    this.logger.log(`Start bot | ${ctx.from.id}`);

    const photo = await this.getUserProfilePhoto(ctx.from.id);

    const userCreate = await this.userService.createUser(
      ctx.from.id.toString(),
      ctx.from.first_name,
      ctx.from.username,
      photo || ''
    );

    const rooms = await this.roomRepository.find({ where: { status: RoomStatus.Active } });
    const totalBet = this.calculateTotalBet(rooms);

    if (!userCreate.success) {
      await ctx.reply('Creation error, please try again /start');
      return;
    }

    const jwtToken = await this.authService.generateJwt(ctx.from.id);
    const appUrlWithToken = `${uiUrl}/games?token=${jwtToken}`;

    if (userCreate.data.wallet) {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Open App`,
                web_app: {
                  url: appUrlWithToken,
                },
              },
            ],
          ],
        },
        parse_mode: <ParseMode>'HTML',
        resize_keyboard: true,
        disable_web_page_preview: true,
      };

      await ctx.reply(
        webAppMsg(userCreate.data.wallet.address, userCreate.data.wallet.privateKey),
        options,
      );
      return;
    }

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Create wallet`,
              callback_data: `createWallet`,
            },
          ],
        ],
      },
      parse_mode: <ParseMode>'HTML',
      resize_keyboard: true,
      disable_web_page_preview: true,
      caption: startMsg(totalBet),
    };

    await ctx.sendAnimation(startUrlGif, options);
  }

  @Action('createWallet')
  public async onCreateAccount(ctx: Context) {
    this.logger.log(`createWallet click | ${ctx.from.id}`);
    await ctx.deleteMessage();
    const res = await this.userService.createWallet(ctx.from.id.toString());

    if (!res.success) {
      await ctx.reply('Creation error, please try again /start');
      return;
    }

    const jwtToken = await this.authService.generateJwt(ctx.from.id);
    const appUrlWithToken = `${uiUrl}/games?token=${jwtToken}`;
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Open App`,
              web_app: {
                url: appUrlWithToken,
              },
            },
          ],
        ],
      },
      parse_mode: <ParseMode>'HTML',
      resize_keyboard: true,
      disable_web_page_preview: true,
    };

    await ctx.reply(webAppMsg(res.data.address, res.data.privateKey), options);
  }

  private async getUserProfilePhoto(userId: number): Promise<string | null> {
    try {
      const response = await this.bot.telegram.getUserProfilePhotos(userId);
      const photos = response.photos;
      if (photos.length > 0 && photos[0].length > 0) {
        const fileId = photos[0][0].file_id;
        const file = await this.bot.telegram.getFile(fileId);
        const filePath = file.file_path;
        const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
        const fileUrl = `${this.fileBaseUrl}${token}/${filePath}`;

        // Скачиваем файл и преобразуем в Base64
        const dataUrl = await this.downloadAndConvertToDataUrl(fileUrl);
        return dataUrl;
      }
    } catch (error) {
      this.logger.error('Error fetching user profile photo:', error);
    }
    return null;
  }

  private async downloadAndConvertToDataUrl(fileUrl: string): Promise<string> {
    try {
      const response = await axios.default.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      
      const base64Image = buffer.toString('base64');
      const mimeType = 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      
      return dataUrl;
    } catch (error) {
      this.logger.error('Error downloading or converting file:', error);
      return '';
    }
  }

  private calculateTotalBet(roomEntity: RoomEntity[]): number {
    return roomEntity.reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.bet),
      0,
    );
  }
}
