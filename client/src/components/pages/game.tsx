//@ts-nocheck
import { PageTitle } from "../general/page-title";
import { GameHeader } from "../game/game-header";
import { Container } from "../general/container";
import { PrepareRabits } from "../game/prepare-rabits";
import TurnInfo from "../game/turn-info";
import { useEffect, useMemo } from "react";
import { $doGameState } from "@/core/models/game";
import { GameStarted } from "../game/game-started";
import { io } from "socket.io-client";
import { apiBaseUrl } from "@/constants/api.constant.ts";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IJoinRoomRes,
  IRabbitsSetReq,
  IUserMoveRes,
  IWinnerRes,
} from "@/interfaces/ws.ts";
import { useAtom, useSetAtom } from "jotai/index";
import { LogoIcon } from "@/assets/logo.icon";
import * as coreModels from "@/core/models";
import { toast } from "sonner";

const Game = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [, , roomId] = pathname.split("/");

  const [gameState, setGameState] = useAtom($doGameState);
  const [WebApp] = useAtom(coreModels.$webApp);
  const [TgButtons] = useAtom(coreModels.$tgButtons);
  const $doLoadWebApp = useSetAtom(coreModels.$doLoadWebApp);

  const socket = io(apiBaseUrl, { autoConnect: false });

  useEffect(() => {
    $doLoadWebApp();
    if (TgButtons) {
      TgButtons.showMainButton(handleRabbitSetSubmission, {
        color: "#E478FA",
        text: "Confirm",
        text_color: "#000000",
        is_active:
          !!gameState.enemyUsername &&
          gameState.userRabbitsPositions?.length === 2,
        is_visible: true,
      });
    }
  }, [WebApp]);

  useEffect(() => {
    TgButtons?.showMainButton(handleRabbitSetSubmission, {
      color: "#E478FA",
      text: "Confirm",
      text_color: "#000000",
      is_active:
        !!gameState.enemyUsername &&
        gameState.userRabbitsPositions?.length === 2,
      is_visible: true,
    });
  }, [gameState.enemyUsername, gameState.userRabbitsPositions]);

  useEffect(() => {
    socket.connect();

    socket.on("disconnect", () => {
      // fire when socked is disconnected
      console.log("Socket disconnected");
    });

    // fire when socked is disconnected
    socket.on(`readyForBattle:${roomId}`, (body: IJoinRoomRes) => {
      // fire when socked is disconnected
      const prizePool = Number(body.bet) + Number(body.bet) * 0.99;
      const enemyUsername =
        WebApp?.initDataUnsafe.user?.username === body.username
          ? body.opponentName
          : body.username;
      setGameState((prevState) => ({ ...prevState, enemyUsername, prizePool }));
    });

    socket.on(
      `serverRabbitSet:${roomId}:${WebApp?.initDataUnsafe.user?.id}`,
      (body: { contractRoomId: number; isRoomCreator: boolean }) => {
        console.log("body", body);
        TgButtons.mainButton.hideProgress();
        setGameState((prevState) => ({
          ...prevState,
          gameId: body.contractRoomId,
          isUserRoom: body.isRoomCreator,
        }));
      }
    );

    socket.on(`gameStarted:${roomId}`, () => {
      setGameState((prevState) => ({ ...prevState, stage: "gameStarted" }));
    });

    socket.on(
      `serverUserMove:${roomId}`,
      ({ lastMove, telegramUserId }: IUserMoveRes) => {
        toast("Move transaction confirmed");

        const currentUserTelegramId = WebApp.initDataUnsafe.user?.id;

        console.log("lastMove", lastMove);
        console.log("currentUserTelegramId", currentUserTelegramId);
        if (currentUserTelegramId === undefined) {
          return;
        }
        console.log(gameState)

        // if user made this move
        if (currentUserTelegramId === telegramUserId) {
          toast("Move transaction confirmed");

          // then we swap turns and set "current" move as user last move
          const userMoves = [...gameState.userMoves];

          if (lastMove) {
            userMoves.push(lastMove);
          }

          setGameState((prevState) => ({
            ...prevState,
            isUserTurn: false,
            userMove: null,
            userMoves,
          }));
        } else {
          // if opponent make their move that means opponent verified our last move, ie if we hit him in our last move
          const userMoves = [...gameState.userMoves];
          const enemyMoves = [...gameState.enemyMoves];

          if (lastMove) {
            enemyMoves.push(lastMove);
          }

          // if it's first move - skip
          if (lastMove === null) {
            setGameState((prevState) => ({
              ...prevState,
              enemyMoves,
              isUserTurn: true,
            }));
            return;
          } else {
            const lastUserMove = {
              ...userMoves[gameState.userMoves.length - 1],
            };
            lastUserMove.isHit = lastMove.isHit;
            userMoves[gameState.userMoves.length - 1] = lastUserMove;
            // save move result
            setGameState((prevState) => ({
              ...prevState,
              userMoves,
              enemyMoves,
              isUserTurn: true,
            }));
          }
        }
      }
    );

    socket.on(`winner:${roomId}`, ({ address }: IWinnerRes) => {
      setGameState((prevState) => ({ ...prevState, winner: address }));
      navigate(`/game-result/${roomId}`);
    });

    // remove all event listeners
    return () => {
      socket.off("disconnect");
      socket.off("connect");
      socket.off(`readyForBattle:${roomId}`);
      socket.off(`serverRabbitSet:${roomId}`);
    };
  }, []);

  const renderBoard = useMemo(() => {
    if (gameState.stage === "setRabits") {
      return <PrepareRabits />;
    }
    if (gameState.stage === "gameStarted") {
      return <GameStarted />;
    }
  }, [gameState.stage]);

  const pageTitle = useMemo(() => {
    if (gameState.stage === "setRabits") {
      return "Start Battle";
    }

    return (
      <>
        <LogoIcon />
        <span className="text-fuchsia-400">#{gameState.gameId}</span>
      </>
    );
  }, [gameState.gameId, gameState.stage]);

  const handleRabbitSetSubmission = () => {
    const req: IRabbitsSetReq = {
      roomId,
      rabbits: gameState.userRabbitsPositions as [],
      telegramUserId: WebApp.initDataUnsafe.user!.id as number,
    };
    socket.connect();
    socket.emit("clientRabbitsSet", req);
    TgButtons.mainButton.showProgress();
  };

  return (
    <Container className="flex flex-col items-center">
      <PageTitle>{pageTitle}</PageTitle>
      <GameHeader
        prizePool={gameState.prizePool.toString()}
        name={WebApp?.initDataUnsafe.user?.username}
        opponentName={
          gameState.enemyUsername ? gameState.enemyUsername : "Opponent"
        }
      />
      <div className="w-full flex flex-col items-center justify-cente mt-5 gap-2">
        <TurnInfo />
        {renderBoard}
      </div>
    </Container>
  );
};

export { Game };
