import { Module } from '@nestjs/common';
import { NlqController } from './nlq.controller';
import { NlqService } from './nlq.service';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [InsightsModule],
  controllers: [NlqController],
  providers: [NlqService],
  exports: [NlqService],
})
export class NlqModule {}
