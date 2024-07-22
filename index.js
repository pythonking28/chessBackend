import express from 'express';
import http from 'http'
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app)
const io = new Server(server,{
    cors:{
        origin: '*'
    }
})
const game = [];

const playerRole = {
    white: "",
    black: ""
};

io.on('connection',(socket)=>{

    console.log("connected")

    if(!playerRole.white){
        playerRole.white = socket.id
        socket.emit("sid",socket.id)
        console.log(playerRole.white)
    }else if(!playerRole.black){
        playerRole.black = socket.id
        socket.emit("sid",socket.id)
        console.log(playerRole.black)
    }

    if(playerRole.white && playerRole.black){
        console.log("game started")
        game.push(playerRole)
        playerRole.white = ""
        playerRole.black = ""
    }



    socket.on("msg", (message) => {
        console.log(message);
        socket.emit("retMsg", "Ye return gift ki tarah return message hai smha na")
    })
})




server.listen(3001,() => {
    console.log("server is running on port 3001")
})
