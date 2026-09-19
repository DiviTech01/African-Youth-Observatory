import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { CountryNarrativeService } from './country-narrative.service';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';
import { AiBudgetService } from './ai-budget.service';

@Module({
  controllers: [InsightsController],
  providers: [InsightsService, CountryNarrativeService, AiService, AiContextService, AiBudgetService],
  exports: [InsightsService, CountryNarrativeService, AiService, AiContextService, AiBudgetService],
})
export class InsightsModule {}
