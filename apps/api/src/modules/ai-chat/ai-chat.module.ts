import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { NlqModule } from '../nlq/nlq.module';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [NlqModule, InsightsModule],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
