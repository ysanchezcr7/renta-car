import { Expose, Type } from 'class-transformer';

export class EligibilityIssueDto {
  @Expose() code: string;
  @Expose() message: string;
}

export class ClientEligibilityResponseDto {
  @Expose() eligible: boolean;
  @Expose() requiresRiskInsurance: boolean;
  @Expose() @Type(() => EligibilityIssueDto) issues: EligibilityIssueDto[];
}
