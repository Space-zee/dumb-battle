import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoomEntity } from './room.entity';

@Entity('Transaction')
export class TransactionEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  public id: number;

  @Column({ name: 'userId', nullable: false })
  public userId: number;

  @Column({ name: 'roomId', nullable: false })
  public roomId: number;

  @Column({ name: 'hash', length: 255, nullable: false })
  public hash: string;

  @Column({ name: 'type', length: 255, nullable: false })
  public type: string;

  @Column({ name: 'status', length: 255, nullable: false })
  public status: string;

  @Column({
    name: 'createdAt',
    type: 'timestamp',
    precision: 3,
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  public createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.rooms)
  user: UserEntity;

  @ManyToOne(() => RoomEntity)
  room: RoomEntity;
}
