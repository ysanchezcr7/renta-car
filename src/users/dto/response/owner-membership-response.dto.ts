import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OwnerMembershipResponseDto {
	@Expose()
	@ApiProperty()
	isSubscribed: boolean;

	@Expose()
	@ApiProperty()
	subscriptionstartDate: string;

	@Expose()
	@ApiProperty()
	subscriptionEndDate: string;

	@Expose()
	@ApiProperty()
	membershipType: string;

	@Expose()
	@ApiProperty()
	paidAmount: number;

	@Expose()
	@ApiProperty()
	stripeSubscriptionId: string;
}
