import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LiveFeedService } from './live-feed.service';

/**
 * WebSocket Gateway for real-time data feeds.
 *
 * Events emitted:
 *   - platform_pulse  (every 30s)  — live platform stats
 *   - data_ticker     (every 60s)  — rotating indicator highlights
 *   - spotlight        (every 5m)   — featured country spotlight
 *
 * Client can also request any feed on-demand via message events.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/live',
})
export class LiveFeedGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('LiveFeedGateway');
  private pulseInterval: ReturnType<typeof setInterval>;
  private tickerInterval: ReturnType<typeof setInterval>;
  private spotlightInterval: ReturnType<typeof setInterval>;

  constructor(private readonly liveFeedService: LiveFeedService) {}

  afterInit() {
    this.logger.log('WebSocket Live Feed gateway initialized');

    // Platform Pulse — every 30 seconds
    this.pulseInterval = setInterval(async () => {
      try {
        const pulse = await this.liveFeedService.getPlatformPulse();
        this.server.emit('platform_pulse', pulse);
      } catch (err) {
        this.logger.error('Pulse broadcast error:', err);
      }
    }, 30_000);

    // Data Ticker — every 60 seconds
    this.tickerInterval = setInterval(async () => {
      try {
        const ticker = await this.liveFeedService.getDataTicker();
        this.server.emit('data_ticker', ticker);
      } catch (err) {
        this.logger.error('Ticker broadcast error:', err);
      }
    }, 60_000);

    // Spotlight — every 5 minutes
    this.spotlightInterval = setInterval(async () => {
      try {
        const spotlight = await this.liveFeedService.getSpotlight();
        this.server.emit('spotlight', spotlight);
      } catch (err) {
        this.logger.error('Spotlight broadcast error:', err);
      }
    }, 5 * 60_000);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send initial data on connect
    this.sendInitialData(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Send all three feeds immediately when a client connects.
   */
  private async sendInitialData(client: Socket) {
    try {
      const [pulse, ticker, spotlight] = await Promise.all([
        this.liveFeedService.getPlatformPulse(),
        this.liveFeedService.getDataTicker(),
        this.liveFeedService.getSpotlight(),
      ]);

      client.emit('platform_pulse', pulse);
      client.emit('data_ticker', ticker);
      client.emit('spotlight', spotlight);
    } catch (err) {
      this.logger.error('Initial data send error:', err);
    }
  }

  /**
   * On-demand: client can request a specific feed by sending a message.
   */
  @SubscribeMessage('request_pulse')
  async handleRequestPulse(client: Socket) {
    const pulse = await this.liveFeedService.getPlatformPulse();
    client.emit('platform_pulse', pulse);
  }

  @SubscribeMessage('request_ticker')
  async handleRequestTicker(client: Socket) {
    const ticker = await this.liveFeedService.getDataTicker();
    client.emit('data_ticker', ticker);
  }

  @SubscribeMessage('request_spotlight')
  async handleRequestSpotlight(client: Socket) {
    const spotlight = await this.liveFeedService.getSpotlight();
    client.emit('spotlight', spotlight);
  }

  /**
   * Clean up intervals on module destroy.
   */
  onModuleDestroy() {
    clearInterval(this.pulseInterval);
    clearInterval(this.tickerInterval);
    clearInterval(this.spotlightInterval);
    this.logger.log('WebSocket intervals cleared');
  }
}
