// create-membership.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
export enum PaymentMethodType {
  STRIPE = 'STRIPE',
  APPLE_IAP = 'APPLE_IAP',
}

export enum MembershipType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export class CreateOwnerMembershipDto {
  @ApiProperty({
    description: 'Tipo de membresía: MONTHLY, QUARTERLY o YEARLY',
    example: MembershipType.MONTHLY,
  })
  @IsEnum(MembershipType)
  membershipType: MembershipType;

  @ApiProperty({
    description:
      'Monto fijo de la membresía (requerido solo para STRIPE, ignorado para APPLE_IAP)',
    example: 29.99,
    required: false,
  })
  @ValidateIf(
    (o: { paymentMethod?: PaymentMethodType }) =>
      !o.paymentMethod || o.paymentMethod === PaymentMethodType.STRIPE,
  )
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'amount must be greater than 0 when using STRIPE' })
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Método de pago: STRIPE o APPLE_IAP',
    enum: PaymentMethodType,
    example: PaymentMethodType.STRIPE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentMethodType)
  paymentMethod?: PaymentMethodType;
}
