import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';
import { OwnerMembershipResponseDto } from './owner-membership-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { SingleResponseDto } from 'src/common/dto/response';

export class UpdateUserResponseDto extends SingleResponseDto<UserResponseDto> {
	@ApiProperty()
	@ValidateNested()
	@Type(() => UserResponseDto)
	declare data: UserResponseDto;
}

export class ProfileUserResponseDto extends SingleResponseDto<UserResponseDto> {
	@ApiProperty()
	@ValidateNested()
	@Type(() => UserResponseDto)
	declare data: UserResponseDto;

	@ApiProperty()
	@ValidateNested()
	@Type(() => OwnerMembershipResponseDto)
	membership?: OwnerMembershipResponseDto;
}
