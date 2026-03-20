import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NlqService } from './nlq.service';
import { NlqQueryDto } from './nlq.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('nlq')
@Controller('nlq')
export class NlqController {
  constructor(private readonly nlqService: NlqService) {}

  @Public()
  @Throttle({ medium: { ttl: 60000, limit: 10 } })
  @Post('query')
  @ApiOperation({
    summary: 'Ask a natural language question about African youth data',
    description: 'Submit a question in plain English and receive a data-backed answer with visualization suggestions.',
  })
  query(@Body() dto: NlqQueryDto) {
    return this.nlqService.processQuery(dto.question);
  }
}
