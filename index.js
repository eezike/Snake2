//https://socket.io/docs/emit-cheatsheet/
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

let rooms = 0
let names = {};

io.on('connection', (socket) => {

  // Create a new game room and notify the creator of game.
  socket.on('createGame', (data) => {
    socket.join(`room-${++rooms}`);
    const room = `room-${rooms}`;
    socket.emit('newGame', { name: data.name, room: room });
    names[room] = [data.name]
  });

  // Connect the Player 2 to the room he requested. Show error if room full.
  socket.on('joinGame', function (data) {
    var room = io.nsps['/'].adapter.rooms[data.room];
    if (room && room.length < 4) {
      socket.join(data.room);
      names[data.room].push(data.name)
      socket.broadcast.to(data.room).emit('joinEveryoneElse', {joinees: names[data.room], room: data.room});
      socket.emit('joinSender', {
        joinees: names[data.room],
        room: data.room,
        playerIndex: names[data.room].length-1
      });
    } else {
      socket.emit('err', { message: 'Sorry, The room is full!' });
    }
  });

  socket.on('startGame', (data) => {

     io.in(data.room).emit('gameHasStarted', data);

  });

  socket.on("movementMade", (data) => {

    socket.broadcast.to(data.room).emit('movementReceived', {
      playerIndex: data.playerIndex,
      playerSnake: data.snake
    })
  });

  socket.on("foodEaten", (data) => {
    socket.broadcast.to(data.room).emit('newFood', {
      foods: data.foods
    });
  });

  socket.on('gameEnded', (data) => {
    socket.broadcast.to(data.room).emit('gameEnd', data);
  });

});

server.listen(5000);

