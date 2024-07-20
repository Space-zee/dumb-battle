import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import * as dotenv from 'dotenv';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from '../../../db/entities/room.entity';
import { AuthModule } from '../auth/auth.module';

dotenv.config();

@Module({
  imports: [UserModule, AuthModule, TypeOrmModule.forFeature([RoomEntity])],
  providers: [TelegramService],
})
export class TelegramModule {}
