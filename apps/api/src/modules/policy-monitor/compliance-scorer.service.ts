import { Injectable } from '@nestjs/common';

/**
 * AYC Compliance Scoring Engine
 *
 * Scores each country's youth policy compliance on a 0–100 scale
 * across 7 weighted base components, plus an optional 8th:
 *
 *   1. AYC Ratification           (20%) — Has the country ratified the African Youth Charter?
 *   2. National Youth Policy      (20%) — Does the country have an adopted national youth policy?
 *   3. Policy Currency            (15%) — How recent is the policy? (adopted or revised within last 7 years)
 *   4. WPAY Compliance            (15%) — Does the policy align with the World Programme of Action for Youth?
 *   5. Policy Status              (10%) — Is the policy currently active?
 *   6. Youth Index Performance    (10%) — Country's Youth Index score (normalized 0–100)
 *   7. Data Availability          (10%) — How many indicators have data for this country?
 *   8. AYC Policy Index           (15%) — PACSDA composite policy index score (when available)
 *
 * When aycPolicyIndexScore is null the 8 existing base weights apply unchanged (total = 1.0).
 * When aycPolicyIndexScore is present the 7 base weights are scaled by 0.85 and the 8th
 * component contributes the remaining 0.15, keeping the total at 1.0.
 */

export interface ComplianceInput {
  aycRatified: boolean;
  aycRatifiedYear: number | null;
  hasNationalPolicy: boolean;
  yearAdopted: number | null;
  yearRevised: number | null;
  wpayCompliant: boolean;
  policyStatus: string;
  youthIndexScore: number | null;      // 0-100 overall score
  dataAvailability: number;            // 0-1 ratio of indicators with data
  aycPolicyIndexScore: number | null;  // 0-100 composite from AYC Scorecard, null if not in dataset
}

export interface ComplianceResult {
  overallScore: number;
  components: {
    aycRatification: number;
    nationalYouthPolicy: number;
    policyCurrency: number;
    wpayCompliance: number;
    policyStatus: number;
    youthIndexPerformance: number;
    dataAvailability: number;
    aycPolicyIndex: number;
  };
  tier: 'EXEMPLARY' | 'STRONG' | 'MODERATE' | 'DEVELOPING' | 'MINIMAL';
  recommendations: string[];
}

// Base weights for the 7 original components (sum = 1.0)
const BASE_WEIGHTS = {
  aycRatification:     0.20,
  nationalYouthPolicy: 0.20,
  policyCurrency:      0.15,
  wpayCompliance:      0.15,
  policyStatus:        0.10,
  youthIndexPerformance: 0.10,
  dataAvailability:    0.10,
};

// Weight allocated to the AYC Policy Index when data is present.
// The 7 base weights are scaled by (1 - AYC_INDEX_WEIGHT) so the total stays 1.0.
const AYC_INDEX_WEIGHT = 0.15;
const BASE_SCALE_WITH_AYC = 1 - AYC_INDEX_WEIGHT; // 0.85

@Injectable()
export class ComplianceScorerService {
  /**
   * Compute the compliance score for a single country.
   */
  score(input: ComplianceInput, referenceYear: number = 2023): ComplianceResult {
    const hasAyc = input.aycPolicyIndexScore !== null && input.aycPolicyIndexScore !== undefined;

    const components = {
      aycRatification:      this.scoreAycRatification(input),
      nationalYouthPolicy:  this.scoreNationalPolicy(input),
      policyCurrency:       this.scorePolicyCurrency(input, referenceYear),
      wpayCompliance:       this.scoreWpayCompliance(input),
      policyStatus:         this.scorePolicyStatus(input),
      youthIndexPerformance: this.scoreYouthIndex(input),
      dataAvailability:     this.scoreDataAvailability(input),
      aycPolicyIndex:       hasAyc ? Math.min(100, Math.max(0, input.aycPolicyIndexScore!)) : 0,
    };

    // When AYC data is present: base weights × 0.85, AYC gets 0.15
    // When not present: base weights × 1.0, AYC contributes 0
    const scale = hasAyc ? BASE_SCALE_WITH_AYC : 1.0;

    const overallScore = Math.round(
      (components.aycRatification      * BASE_WEIGHTS.aycRatification      * scale +
       components.nationalYouthPolicy  * BASE_WEIGHTS.nationalYouthPolicy  * scale +
       components.policyCurrency       * BASE_WEIGHTS.policyCurrency       * scale +
       components.wpayCompliance       * BASE_WEIGHTS.wpayCompliance       * scale +
       components.policyStatus         * BASE_WEIGHTS.policyStatus         * scale +
       components.youthIndexPerformance * BASE_WEIGHTS.youthIndexPerformance * scale +
       components.dataAvailability     * BASE_WEIGHTS.dataAvailability     * scale +
       components.aycPolicyIndex       * (hasAyc ? AYC_INDEX_WEIGHT : 0)) *
      100,
    ) / 100;

    const tier = this.assignTier(overallScore);
    const recommendations = this.generateRecommendations(input, components);

    return { overallScore, components, tier, recommendations };
  }

  private scoreAycRatification(input: ComplianceInput): number {
    if (!input.aycRatified) return 0;
    // Full marks for ratification; bonus consideration for early adopters is reflected in the score
    if (input.aycRatifiedYear && input.aycRatifiedYear <= 2010) return 100;
    if (input.aycRatifiedYear && input.aycRatifiedYear <= 2015) return 90;
    return 80;
  }

  private scoreNationalPolicy(input: ComplianceInput): number {
    if (!input.hasNationalPolicy) return 0;
    if (!input.yearAdopted) return 20; // Draft exists but not adopted
    return 100;
  }

  private scorePolicyCurrency(input: ComplianceInput, referenceYear: number): number {
    const mostRecent = input.yearRevised || input.yearAdopted;
    if (!mostRecent) return 0;

    const age = referenceYear - mostRecent;
    if (age <= 3) return 100;  // Very current
    if (age <= 5) return 80;   // Current
    if (age <= 7) return 60;   // Aging
    if (age <= 10) return 40;  // Outdated
    if (age <= 15) return 20;  // Very outdated
    return 10;                  // Severely outdated
  }

  private scoreWpayCompliance(input: ComplianceInput): number {
    return input.wpayCompliant ? 100 : 0;
  }

  private scorePolicyStatus(input: ComplianceInput): number {
    switch (input.policyStatus) {
      case 'active': return 100;
      case 'inactive': return 30;
      case 'draft': return 15;
      default: return 0;
    }
  }

  private scoreYouthIndex(input: ComplianceInput): number {
    if (input.youthIndexScore === null) return 50; // Neutral if no score
    return Math.min(100, Math.max(0, input.youthIndexScore));
  }

  private scoreDataAvailability(input: ComplianceInput): number {
    return Math.round(Math.min(1, Math.max(0, input.dataAvailability)) * 100);
  }

  private assignTier(score: number): ComplianceResult['tier'] {
    if (score >= 80) return 'EXEMPLARY';
    if (score >= 65) return 'STRONG';
    if (score >= 50) return 'MODERATE';
    if (score >= 35) return 'DEVELOPING';
    return 'MINIMAL';
  }

  private generateRecommendations(
    input: ComplianceInput,
    components: ComplianceResult['components'],
  ): string[] {
    const recs: string[] = [];

    if (components.aycRatification === 0) {
      recs.push('Ratify the African Youth Charter to demonstrate commitment to youth development.');
    }

    if (components.nationalYouthPolicy === 0) {
      recs.push('Develop and adopt a comprehensive National Youth Policy.');
    } else if (components.nationalYouthPolicy === 20) {
      recs.push('Formalize the draft youth policy through official adoption.');
    }

    if (components.policyCurrency < 60) {
      recs.push('Review and update the national youth policy to reflect current youth priorities.');
    }

    if (components.wpayCompliance === 0) {
      recs.push('Align national youth policy with the World Programme of Action for Youth (WPAY) framework.');
    }

    if (components.policyStatus < 100) {
      recs.push('Ensure the national youth policy has active implementation status.');
    }

    if (components.dataAvailability < 50) {
      recs.push('Improve youth data collection and reporting to enable evidence-based policymaking.');
    }

    if (input.aycPolicyIndexScore !== null && components.aycPolicyIndex < 50) {
      recs.push('Strengthen policy instruments across key AYC dimensions (economic inclusion, digital innovation, green transition).');
    }

    return recs;
  }
}
