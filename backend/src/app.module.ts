import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramModule } from './modules/telegram/telegram.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GatewayModule } from './modules/gateway/gateway.module';
import { ApiModule } from './modules/api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      validationOptions: {
        abortEarly: false,
      },
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async  (configService: ConfigService) => ({ 
        token: configService.get<string>("TELEGRAM_BOT_TOKEN"),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USERNAME"),
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_NAME"),
        timezone: 'Z',
        synchronize: true,
        entities: ['dist/db/entities/*.entity.js'],
        migrations: ['dist/db/migrations/*.js'],
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
    TelegramModule,
    GatewayModule,
    ApiModule,
  ],
})
export class AppModule {}
