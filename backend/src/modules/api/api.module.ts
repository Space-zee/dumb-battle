import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from '../../../db/entities/room.entity';
import { UserEntity } from '../../../db/entities/user.entity';
import { ProviderModule } from '../provider/provider.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoomEntity, UserEntity]), ProviderModule],
  providers: [ApiService],
  controllers: [ApiController],
})
export class ApiModule {}
