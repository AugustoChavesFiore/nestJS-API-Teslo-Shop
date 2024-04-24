import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { bcrypt } from 'src/configs/bcrypt';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';


@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { };

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password);
    try {
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,

      });
      await this.userRepository.save(user);
      delete user.password;
      return user;
    }
    catch (error) {
      this.handleDBError(error);
    }

  };

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: { email: true, password: true },
      });
      if (!user) throw new UnauthorizedException('Invalid email or password');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password');
      return {
        ...user,
        token: this.getJwtToken({ id: user.id}),
      };

    } catch (error) {
      this.handleAuthError(error);
    }
  };



  async checkAuthStatus(user: User) {
    return {
      user,
      token: this.getJwtToken({ id: user.id }),
    };

  };


  private getJwtToken(payload:JwtPayload){
    const token = this.jwtService.sign(payload);
    return token;
  };



  private handleDBError(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    console.log(error);
    throw new InternalServerErrorException('Please check server logs for more details');
  };

  private handleAuthError(error: any): never {
    if (error.status === 401) {
      throw new UnauthorizedException(error.message);
    }
    throw new InternalServerErrorException('Please check server logs for more details');
  }
}
