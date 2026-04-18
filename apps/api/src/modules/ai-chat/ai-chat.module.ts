import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { NlqModule } from '../nlq/nlq.module';

@Module({
  imports: [NlqModule],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
