import { atom } from "jotai";
import { GameState } from "./game.types";

export const initialGameState: GameState = {
  gameId: 65,
  prizePool: 0,
  winner: null,
  isUserTurn: false,
  // isUserTurn: false,
  // isUserRoom: false,
  enemyUsername: null,
  stage: "setRabits",
  // stage: "gameStarted",
  // userRabbitsPositions: null,
  userRabbitsPositions: [
    // { x: 1, y: 2 },
    // { x: 0, y: 1 },
  ],
  isUserRoom: false,
  userMove: null,
  enemyMoves: [],
  userMoves: [
    // { coordinates: { x: 1, y: 0 }, isHit: false, moveId: 0 },
    // { coordinates: { x: 2, y: 0 }, isHit: true, moveId: 0 },
  ],
};

export const $doGameState = atom<GameState>(initialGameState);
