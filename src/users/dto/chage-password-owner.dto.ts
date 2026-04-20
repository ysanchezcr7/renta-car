import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordOwnerDTO {
  @IsString()
  @MinLength(8, {
    message: 'The new password must be at least 8 characters long.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'The new password must contain at least one capital letter and one number.',
  })
  newPassword: string;
}
