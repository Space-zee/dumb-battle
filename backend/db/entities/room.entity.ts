import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('Room')
export class RoomEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  public id: number;

  @Column({ name: 'gameCreatorUserId', nullable: false })
  public gameCreatorUserId: number;

  @Column({ name: 'joinUserId', nullable: true })
  public joinUserId: number;

  @Column({ name: 'roomId', length: 255, nullable: false })
  public roomId: string;

  @Column({ name: 'contractRoomId', nullable: true })
  public contractRoomId: number;

  @Column({ name: 'status', length: 255, nullable: false })
  public status: string;

  @Column({ name: 'bet', length: 255, nullable: false })
  public bet: string;

  @Column({ name: 'moveDeadline', nullable: true, type: 'bigint' })
  public moveDeadline: string;

  @Column({
    name: 'createdAt',
    type: 'timestamp',
    precision: 3,
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  public createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.id)
  gameCreatorUser: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  joinUser: UserEntity;
}
