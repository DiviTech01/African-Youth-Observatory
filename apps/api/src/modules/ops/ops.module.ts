import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { InsightsModule } from '../insights/insights.module';
import { ContentModule } from '../content/content.module';

@Module({
  // InsightsModule exports AiService, which OpsService uses for the Anthropic
  // health check; ContentModule exports R2Service for the storage check.
  // MailService comes from the global MailModule.
  imports: [InsightsModule, ContentModule],
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
