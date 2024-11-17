const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {cors: {
    origin: 'http://localhost:4200', // Allow Angular app on localhost:4200
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true // Allow cookies if needed (optional)
  }});

const PORT = process.env.PORT || 3000;

// app.use(express.static('public')); // Serve static files from the 'public' folder

app.use(cors({
    origin: '*', // Allow only the Angular app's origin
    methods: ['GET', 'POST'], // Allowed HTTP methods
    allowedHeaders: '*', // Allowed headers
  }));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('a user connected: ' + socket.id);

  // Listen for 'move' events from clients
  socket.on('action',(data) => {
    console.log('Player Action:', data);
    // Broadcast the move to other players
    socket.broadcast.emit(data.action, data);
  });



  // VOICE

  // When a user sends an offer (for WebRTC signaling)
  socket.on('offer', (offer, roomId) => {
    console.log(`Received offer in room ${roomId}`);
    socket.to(roomId).emit('offer', offer, socket.id);
  });

  // When a user sends an answer (for WebRTC signaling)
  socket.on('answer', (answer, roomId) => {
    socket.to(roomId).emit('answer', answer, socket.id);
  });

  // Handle ICE candidates (for WebRTC)
  socket.on('ice-candidate', (candidate, roomId) => {
    socket.to(roomId).emit('ice-candidate', candidate, socket.id);
  });

  // Create or join a game room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room ${roomId}`);

    // Inform other players in the room about the new player
    socket.to(roomId).emit('new-player', socket.id);

    // Limit the number of players to 4
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size > 4) {
      socket.emit('room-full');
      socket.disconnect();
    }
  });


  //---------

  // When a player disconnects
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
