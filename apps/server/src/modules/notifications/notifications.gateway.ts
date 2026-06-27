import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*', // Customize to client address in production
    credentials: true,
  },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Connection attempt rejected: No token provided (Socket ID: ${client.id})`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('jwt.accessTokenSecret');
      const payload = this.jwtService.verify(token, { secret });
      
      const userId = payload.sub;
      client.data = { userId };
      
      // Join a user-specific room for targeted notifications
      const roomName = `user_${userId}`;
      await client.join(roomName);
      
      this.logger.log(`Socket Client connected: User ID ${userId} joined room ${roomName} (Socket ID: ${client.id})`);
    } catch (err) {
      this.logger.error(`Connection attempt failed (Socket ID: ${client.id}): Invalid auth token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket Client disconnected: Socket ID ${client.id}`);
  }

  sendNotificationToUser(userId: number, event: string, payload: any) {
    const roomName = `user_${userId}`;
    this.server.to(roomName).emit(event, payload);
    this.logger.log(`Emitted event '${event}' to room '${roomName}'`);
  }
}
