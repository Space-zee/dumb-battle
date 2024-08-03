import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../db/entities/user.entity';
import { WalletEntity } from '../../../db/entities/wallet.entity';
import { GatewayService } from './gateway.service';
import { RoomEntity } from '../../../db/entities/room.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

dotenv.config();

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, WalletEntity, RoomEntity]), UserModule, AuthModule],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}