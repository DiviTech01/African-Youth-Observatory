import { Module } from '@nestjs/common';
import { LiveFeedController } from './live-feed.controller';
import { LiveFeedService } from './live-feed.service';
import { LiveFeedGateway } from './live-feed.gateway';

@Module({
  controllers: [LiveFeedController],
  providers: [LiveFeedService, LiveFeedGateway],
  exports: [LiveFeedService],
})
export class LiveFeedModule {}
