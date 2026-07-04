let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: '*', // Allow all origins for seamless development and testing
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    io.on('connection', (socket) => {
      console.log(`Socket Client Connected: ${socket.id}`);

      // Allow users/shop owners to join their private room (e.g. user_userId or shop_shopId)
      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Client ${socket.id} joined room: ${room}`);
      });

      socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`Client ${socket.id} left room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`Socket Client Disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIO: () => {
    return io;
  }
};
