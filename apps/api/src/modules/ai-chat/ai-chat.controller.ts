import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiChatService } from './ai-chat.service';
import { Public } from '../auth/decorators/public.decorator';

class ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

class AiChatDto {
  message: string;
  context?: string;
  history?: ChatHistoryItem[];
}

@ApiTags('ai')
@Controller('ai')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Public()
  @Throttle({ medium: { ttl: 60000, limit: 10 } })
  @Post('chat')
  @ApiOperation({
    summary: 'Chat with the African Youth Observatory AI assistant',
    description:
      'Send a message and receive an AI-powered response with optional data visualizations. Falls back to rule-based NLQ if the AI service is unavailable.',
  })
  async chat(@Body() dto: AiChatDto) {
    return this.aiChatService.chat(dto.message, dto.context, dto.history);
  }
}
