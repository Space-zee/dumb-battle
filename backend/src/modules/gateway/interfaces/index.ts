export interface ICreateLobbyReq {
  bet: string;
}

export interface ICreateLobbyRes {
  roomId: string;
  bet: string;
}

export interface IJoinRoomReq {
  roomId: string;
  telegramUserId: number;
}

export interface IJoinRoomRes {
  bet: string;
  roomId: string;
  creatorName: string;
  opponentName: string;
  roomCreatorId: number;
}

export interface IRabbitsSetReq {
  rabbits: ICoordinates[];
  telegramUserId: number;
  roomId: string;
}
export interface IRabbitsSetRes {
  contractRoomId: number;
}

export interface IUserMoveReq {
  coordinates: ICoordinates;
  userRabbits: ICoordinates[];
  telegramUserId: number;
  roomId: string;
}

export interface ICoordinates {
  x: number;
  y: number;
}
