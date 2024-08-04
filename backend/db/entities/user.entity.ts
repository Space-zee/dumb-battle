import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WalletEntity } from './wallet.entity';
import { RoomEntity } from './room.entity';

@Entity('User')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  public id: number;

  @Column({ name: 'telegramUserId', nullable: false, type: 'bigint', unique: true })
  public telegramUserId: string;

  @Column({ name: 'firstName', length: 50, charset: 'utf8', nullable: true })
  public firstName: string;

  @Column({ name: 'username', length: 255, nullable: false })
  public username: string;

  @Column({ name: 'photo', type: 'text', nullable: true })
  public photo: string;

  @Column({ name: 'nonce', nullable: false })
  public nonce: number;

  @Column({ name: 'win', nullable: false, default: 0 })
  public win: number;

  @Column({ name: 'lose', nullable: false, default: 0 })
  public lose: number;

  @Column({
    name: 'createdAt',
    type: 'timestamp',
    precision: 3,
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  public createdAt: Date;

  @OneToMany(() => WalletEntity, (wallet) => wallet.user)
  @JoinColumn({ name: 'userId' })
  wallets: WalletEntity[];

  @OneToMany(() => RoomEntity, (room) => room.user)
  @JoinColumn({ name: 'userId' })
  rooms: RoomEntity[];
}
