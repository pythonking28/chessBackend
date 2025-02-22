import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Chess } from "chess.js";
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors'

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};


app.use(cors(corsOptions))
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
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

    if (!gameID) {
      gameID = uuidv4();
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
      // console.log("w-"+socket.id)
      socket.emit("sid", "w");
    } else if (!game.playerRole.black) {
      game.playerRole.black = socket.id;
      socket.emit("sid", "b");
      // console.log("b-"+socket.id)
    }
    socket.gameID = gameID;

    socket.join(gameID)
    if(game.playerRole.white && game.playerRole.black) {

        console.log("game started");
    }
  });

  socket.on("move", (message) => {

    const gameID = socket.gameID;
    
    const game = games[gameID]

    if(!game) return
    if(game.playerRole.white === socket.id && game.chess.turn() !== 'w') return
    if(game.playerRole.black === socket.id && game.chess.turn() !== 'b') return
    let turn = game.chess.turn()
    try {
      if (game.chess.move(message)) {
        io.to(gameID).emit("move", game.chess?.fen());
        if(game.chess.inCheck()){
          if(game.chess.isCheckmate()){
            io.to(gameID).emit("win",turn)
          }
        }
        if(game.chess.isDraw() || game.chess.isInsufficientMaterial() || game.chess.isStalemate() || game.chess.isThreefoldRepetition()){
          io.to(gameID).emit("win","d")
        }
      }
    } catch (error) {
      console.error(error);
    }
  });


  socket.on("disconnect", (message) => {
    console.log("disconnected")
    const gameID = socket.gameID;
    const game = games[gameID];
    if(!game) return
    if(!(message==="draw")){
      if(game.playerRole.white === socket.id) {
        game.playerRole.white = ""
        io.to(gameID).emit("win", "b")
      }
      if(game.playerRole.black === socket.id) {
        game.playerRole.black = ""
        io.to(gameID).emit("win", "w")
      }
    }
    delete games[gameID]
  })
  
});

server.listen(process.env.PORT || 4000, () => {
  console.log("server is running on port 3001");
});
