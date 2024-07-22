import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Chess } from "chess.js";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const games = {};

io.on("connection", (socket) => {
    console.log("------------------------------------------")
  console.log("connected");
  socket.on("joinGame", () => {
    console.log("game joined")
    let gameID = Object.keys(games).find((gameID) => {
      const game = games[gameID];
      if(!game.playerRole.white || !game.playerRole.black) return game
      return false;
    }) ?? false;

    console.log(gameID)

    if (!gameID) {
      gameID = uuidv4();
      console.log(gameID)
      games[gameID] = {
        chess: new Chess(),
        playerRole: {
          white: "",
          black: "",
        },
      };
    }
    const game = games[gameID];

    if (!game.playerRole.white) {
      game.playerRole.white = socket.id;
      socket.emit("sid", "w");
    } else if (!game.playerRole.black) {
      game.playerRole.black = socket.id;
      socket.emit("sid", "b");
    }
    socket.gameID = gameID;
    console.log(socket.gameID)
    console.log(game.playerRole.white)
    console.log(game.playerRole.black)
    console.log("socket ko game ID mila ki nahi")
    socket.join(gameID);
    if(game.playerRole.white && game.playerRole.black) {

        console.log("game started");
    }
  });

  socket.on("move", (message) => {
    const gameID = socket.gameID;
    if(!gameID) return

    const game = games[gameID]
    // console.log(game)
    if(game.playerRole.white === socket.id && game.chess.turn() !== 'w') return
    if(game.playerRole.black === socket.id && game.chess.turn() !== 'b') return
    console.log(message);
    try {
      if (game.chess.move(message)) {
        io.to(gameID).emit("move", game.chess?.fen());
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("disconnect", () => {
    const gameID = socket.gameID;
    const game = games[gameID];
    if(!game) return
    if(game.playerRole.white === socket.id) game.playerRole.white = ""
    if(game.playerRole.black === socket.id) game.playerRole.black = ""
    if(!game.playerRole.white && !game.playerRole.black) delete games[gameID]
  })
});

server.listen(3001, () => {
  console.log("server is running on port 3001");
});
