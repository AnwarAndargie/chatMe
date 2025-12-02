import { Server, Socket } from 'socket.io';

const socketHandler = (socket: Socket, io: Server): void => {
    console.log('A user connected:', socket.id);

    let userId: string | null = null;

    socket.on('authenticate', (data: { userId: string }) => {
        userId = data.userId;
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
    });

    socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('send-message', (message: any) => {
        console.log('Received send-message event:', message);

        if (message.sessionId) {
            io.to(message.sessionId).emit('receive-message', message);
            console.log(`Broadcasted message to room ${message.sessionId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (userId) {
            console.log(`User ${userId} disconnected`);
        }
    });
};

export default socketHandler;