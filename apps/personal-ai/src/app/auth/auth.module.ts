import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AdminController } from "./admin.controller";
import {AuthService} from "./auth.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '320m' },
    }),
  ],
  providers: [
    JwtStrategy,
    AuthService,
  ],
  controllers: [AdminController],
})
export class AuthModule {}
