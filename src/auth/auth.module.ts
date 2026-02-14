import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstant } from './Constant/jwt.constants';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OtpRepository } from './repository/otp.repository';
import { MailModule } from '../common/mailer/mailer.modules';
import { UserRepository } from 'src/users/repository/user-repository/user-repository';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OtpRepository, UserRepository],
  imports: [
    PrismaModule,
    MailModule,
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstant.secret,
      signOptions: { expiresIn: '6h' },
    }),
  ],
})
export class AuthModule {}
