import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DriverLicenseKind } from '@prisma/client';

export type EligibilityIssue = { code: string; message: string };

export type EligibilityResult = {
  eligible: boolean;
  requiresRiskInsurance: boolean;
  issues: EligibilityIssue[];
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

@Injectable()
export class QuoteEligibilityService {
  /** Edad en años decimales a la fecha de referencia (pickup). */
  ageDecimalAtDate(dateOfBirth: Date, reference: Date): number {
    return (reference.getTime() - dateOfBirth.getTime()) / MS_PER_YEAR;
  }

  evaluateAge(ageDecimal: number): Pick<EligibilityResult, 'requiresRiskInsurance' | 'issues'> {
    const issues: EligibilityIssue[] = [];
    if (ageDecimal < 21) {
      issues.push({
        code: 'AGE_UNDER_21',
        message: 'No se permite rentar a conductores menores de 21 años.',
      });
    }
    if (ageDecimal >= 80) {
      issues.push({
        code: 'AGE_OVER_80',
        message: 'No se permite rentar a conductores de 80 años o más.',
      });
    }
    const requiresRiskInsurance =
      (ageDecimal >= 21 && ageDecimal <= 24) || (ageDecimal >= 76 && ageDecimal < 80);
    return { requiresRiskInsurance, issues };
  }

  evaluateLicense(
    licenseKind: DriverLicenseKind,
    licenseIssuedAt: Date,
    pickupAt: Date,
  ): EligibilityIssue[] {
    const issues: EligibilityIssue[] = [];
    const minYears = licenseKind === DriverLicenseKind.REX ? 2 : 1;
    const tenureYears = (pickupAt.getTime() - licenseIssuedAt.getTime()) / MS_PER_YEAR;
    if (tenureYears < minYears) {
      issues.push({
        code: 'LICENSE_TENURE',
        message:
          licenseKind === DriverLicenseKind.REX
            ? 'La licencia REX debe tener al menos 2 años de antigüedad a la fecha de pickup.'
            : 'La licencia debe tener al menos 1 año de antigüedad a la fecha de pickup.',
      });
    }
    return issues;
  }

  mergeEligibility(agePart: EligibilityResult, licenseIssues: EligibilityIssue[]): EligibilityResult {
    const issues = [...agePart.issues, ...licenseIssues];
    return {
      eligible: issues.length === 0,
      requiresRiskInsurance: agePart.requiresRiskInsurance,
      issues,
    };
  }

  assertEligibleOrThrow(result: EligibilityResult): void {
    if (!result.eligible) {
      throw new UnprocessableEntityException({
        success: false,
        code: 'QUOTE_ELIGIBILITY_FAILED',
        message: 'El conductor no cumple los requisitos de edad o licencia.',
        issues: result.issues,
      });
    }
  }
}
