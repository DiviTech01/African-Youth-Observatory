import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }
}
