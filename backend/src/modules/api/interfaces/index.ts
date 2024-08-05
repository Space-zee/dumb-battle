export interface IGetActiveRoomsRes {
  username: string;
  bet: string;
  roomId: string;
  creatorId: number;
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
