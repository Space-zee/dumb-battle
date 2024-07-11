import { atom } from "jotai";
import { GlobalState } from "./global.types";

export const initialGlobalState: GlobalState = {
  wallet: null,
  activeRooms: [],
  endedRooms: [],
};

export const $doGlobalState = atom<GlobalState>(initialGlobalState);
