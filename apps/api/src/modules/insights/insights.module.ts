import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { CountryNarrativeService } from './country-narrative.service';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';

@Module({
  controllers: [InsightsController],
  providers: [InsightsService, CountryNarrativeService, AiService, AiContextService],
  exports: [InsightsService, CountryNarrativeService, AiService, AiContextService],
})
export class InsightsModule {}
