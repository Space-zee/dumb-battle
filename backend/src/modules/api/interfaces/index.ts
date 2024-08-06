import { RoomStatus } from '../enums';

export interface IGetActiveRoomsRes {
  status: RoomStatus;
  bet: string;
  roomId: string;
  creator: {
    username?: string;
    photo?: string;
    telegramUserId: number;
  };
  joiner?: {
    username?: string;
    photo?: string;
    telegramUserId: number;
  };
}

interface ICoordinatesWithHit {
  x: number;
  y: number;
  isHit?: boolean;
}

export interface ILoadGameData {
  isScCreated: boolean;
  gameId: number;
  isCreator: boolean;
  userSteps: ICoordinatesWithHit[];
  isUserTurn: boolean;
  bet: string;
  moveDeadline: number;
  opponentName: string;
  opponentSteps: ICoordinatesWithHit[];
}

export interface IGameResultStep {
  x: number;
  y: number;
  isHit: boolean;
  hash: string;
  telegramUserId: number;
  username: string;
}
