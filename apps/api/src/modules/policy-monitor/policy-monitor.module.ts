import { Module } from '@nestjs/common';
import { PolicyMonitorController } from './policy-monitor.controller';
import { PolicyMonitorService } from './policy-monitor.service';
import { ComplianceScorerService } from './compliance-scorer.service';

@Module({
  controllers: [PolicyMonitorController],
  providers: [PolicyMonitorService, ComplianceScorerService],
  exports: [PolicyMonitorService, ComplianceScorerService],
})
export class PolicyMonitorModule {}
