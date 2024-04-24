import { Controller, Get, Post, Body, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Auth, GetUser, RawHeaders, RoleProtected } from './decorators';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { validRoles } from './interfaces';
import { ApiTags } from '@nestjs/swagger';




@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService

  ) { }

  @Post('register')
  createUser(@Body() createuserDto: CreateUserDto) {
    return this.authService.create(createuserDto);
  };

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  };

  @Get('checkAuthStatus')
  @Auth()
  chekAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

}
