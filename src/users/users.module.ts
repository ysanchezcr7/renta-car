import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { UserRepository } from './repository/user-repository/user-repository';

@Module({
  providers: [UserService, UserRepository],
  controllers: [UsersController],
  exports: [UserService, UserRepository],
})
export class UsersModule {}
