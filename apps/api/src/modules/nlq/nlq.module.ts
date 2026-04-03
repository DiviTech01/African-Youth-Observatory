import { Module } from '@nestjs/common';
import { NlqController } from './nlq.controller';
import { NlqService } from './nlq.service';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [InsightsModule],
  controllers: [NlqController],
  providers: [NlqService],
})
export class NlqModule {}
