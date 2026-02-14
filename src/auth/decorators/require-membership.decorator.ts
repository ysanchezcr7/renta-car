import { applyDecorators, UseGuards } from '@nestjs/common';
import { OwnerMembershipGuard } from '../guard/owner-membership.guard';

/**
 * Decorador que requiere que el usuario tenga una membresía activa (trial o pagada).
 * Debe usarse junto con @Auth(Role.OWNER) para asegurar que solo los OWNERs con membresía activa puedan acceder.
 *
 * @example
 * ```typescript
 * @Auth(Role.OWNER)
 * @RequireMembership()
 * @Post('banner/preview')
 * generateBannerPreview() { ... }
 * ```
 */
export function RequireMembership() {
	return applyDecorators(UseGuards(OwnerMembershipGuard));
}
