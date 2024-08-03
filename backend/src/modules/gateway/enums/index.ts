export enum SocketEvents {
  JoinRoomClient = 'joinRoomClient',
  JoinRoomServer = 'joinRoomServer',
  ReadyForBattle = 'readyForBattle',
  ClientRabbitsSet = 'clientRabbitsSet',
  GameCreated = 'gameCreated',
  GameStarted = 'gameStarted',
  ClientUserMove = 'clientUserMove',
  ServerUserMove = 'serverUserMove',
  Winner = 'winner',
  LeaveRoomClient = 'leaveRoomClient',
  LeaveRoomServer = 'leaveRoomServer',
}