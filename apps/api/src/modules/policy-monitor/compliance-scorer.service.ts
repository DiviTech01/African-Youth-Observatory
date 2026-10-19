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
 *   4. AfCFTA Women & Youth Protocol (15%) — Has the country signed / ratified the Protocol to the
 *      Agreement Establishing the AfCFTA on Women and Youth in Trade (AU Assembly, Feb 2024)?
 *      RATIFIED = 100, SIGNED = 50, NOT_SIGNED = 0. UNKNOWN is *excluded*: the component is
 *      dropped and the remaining base weights are renormalised, so "not yet assessed" never
 *      counts as a 0. The breakdown then reports `afcftaProtocol: null` and
 *      `afcftaProtocolAssessed: false` so the UI can say "Not yet assessed".
 *   5. Policy Status              (10%) — Is the policy currently active?
 *   6. Youth Index Performance    (10%) — Country's Youth Index score (normalized 0–100)
 *   7. Data Availability          (10%) — How many indicators have data for this country?
 *   8. AYC Policy Index           (15%) — PACSDA composite policy index score (when available)
 *
 * When aycPolicyIndexScore is null the 7 base weights apply unchanged (total = 1.0).
 * When aycPolicyIndexScore is present the 7 base weights are scaled by 0.85 and the 8th
 * component contributes the remaining 0.15, keeping the total at 1.0.
 */

export type AfcftaProtocolStatus = 'UNKNOWN' | 'NOT_SIGNED' | 'SIGNED' | 'RATIFIED';

export interface ComplianceInput {
  aycRatified: boolean;
  aycRatifiedYear: number | null;
  hasNationalPolicy: boolean;
  yearAdopted: number | null;
  yearRevised: number | null;
  afcftaProtocolStatus: AfcftaProtocolStatus;
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
    afcftaProtocol: number | null;     // null = UNKNOWN, excluded from the score
    policyStatus: number;
    youthIndexPerformance: number;
    dataAvailability: number;
    aycPolicyIndex: number;
  };
  afcftaProtocolAssessed: boolean;
  tier: 'EXEMPLARY' | 'STRONG' | 'MODERATE' | 'DEVELOPING' | 'MINIMAL';
  recommendations: string[];
}

// Base weights for the 7 original components (sum = 1.0)
const BASE_WEIGHTS = {
  aycRatification:     0.20,
  nationalYouthPolicy: 0.20,
  policyCurrency:      0.15,
  afcftaProtocol:      0.15,
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
      afcftaProtocol:       this.scoreAfcftaProtocol(input),
      policyStatus:         this.scorePolicyStatus(input),
      youthIndexPerformance: this.scoreYouthIndex(input),
      dataAvailability:     this.scoreDataAvailability(input),
      aycPolicyIndex:       hasAyc ? Math.min(100, Math.max(0, input.aycPolicyIndexScore!)) : 0,
    };

    const afcftaProtocolAssessed = components.afcftaProtocol !== null;

    // When AYC data is present: base weights × 0.85, AYC gets 0.15
    // When not present: base weights × 1.0, AYC contributes 0
    const scale = hasAyc ? BASE_SCALE_WITH_AYC : 1.0;

    // An unassessed AfCFTA protocol status drops out entirely; the remaining
    // base weights are renormalised so they still sum to 1.0 (×scale).
    const baseWeightTotal = afcftaProtocolAssessed ? 1.0 : 1.0 - BASE_WEIGHTS.afcftaProtocol;
    const norm = scale / baseWeightTotal;

    const overallScore = Math.round(
      (components.aycRatification      * BASE_WEIGHTS.aycRatification      * norm +
       components.nationalYouthPolicy  * BASE_WEIGHTS.nationalYouthPolicy  * norm +
       components.policyCurrency       * BASE_WEIGHTS.policyCurrency       * norm +
       (components.afcftaProtocol ?? 0) * BASE_WEIGHTS.afcftaProtocol      * norm +
       components.policyStatus         * BASE_WEIGHTS.policyStatus         * norm +
       components.youthIndexPerformance * BASE_WEIGHTS.youthIndexPerformance * norm +
       components.dataAvailability     * BASE_WEIGHTS.dataAvailability     * norm +
       components.aycPolicyIndex       * (hasAyc ? AYC_INDEX_WEIGHT : 0)) *
      100,
    ) / 100;

    const tier = this.assignTier(overallScore);
    const recommendations = this.generateRecommendations(input, components);

    return { overallScore, components, afcftaProtocolAssessed, tier, recommendations };
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

  private scoreAfcftaProtocol(input: ComplianceInput): number | null {
    switch (input.afcftaProtocolStatus) {
      case 'RATIFIED': return 100;
      case 'SIGNED': return 50;
      case 'NOT_SIGNED': return 0;
      default: return null; // UNKNOWN: not yet assessed, excluded from the score
    }
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

    if (components.afcftaProtocol === 0) {
      recs.push('Sign and ratify the AfCFTA Protocol on Women and Youth in Trade, then domestically operationalise its youth provisions.');
    } else if (components.afcftaProtocol === 50) {
      recs.push('Ratify the AfCFTA Protocol on Women and Youth in Trade and domestically operationalise its youth provisions.');
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
