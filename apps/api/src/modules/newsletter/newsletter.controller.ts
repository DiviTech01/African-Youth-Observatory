import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './newsletter.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Public()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe an email to the newsletter (upserts on email).' })
  subscribe(@Body() body: SubscribeDto) {
    return this.service.subscribe(body);
  }
}
