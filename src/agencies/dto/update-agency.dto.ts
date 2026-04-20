import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AgencyApprovalStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateAgencyDto } from './create-agency.dto';

export class UpdateAgencyDto extends PartialType(CreateAgencyDto) {
  @ApiPropertyOptional({ description: 'Alta/baja operativa de la agencia' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: AgencyApprovalStatus,
    description:
      'Solo SUPER_ADMIN. PENDING_REVIEW → APPROVED habilita login; REJECTED bloquea.',
  })
  @IsOptional()
  @IsEnum(AgencyApprovalStatus)
  approvalStatus?: AgencyApprovalStatus;

  @ApiPropertyOptional({
    description: 'Motivo visible al rechazar (opcional).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejectionReason?: string;
}
