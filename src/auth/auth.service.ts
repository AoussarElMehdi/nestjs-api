import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/models/user.model';
import { JwtService } from '@nestjs/jwt';

@Injectable({})
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private jwt: JwtService
  ) { }

  async signup(dto: AuthDto) {
    try {
      // generate the password hash
      const hash = await argon.hash(dto.password);
      // save the new user in the db
      const newUser = new this.userModel({
        email: dto.email,
        password: hash
      });

      const result = await newUser.save();

      // return the saved user
      return result;
    } catch (error) {
      return error;
    }
  }

  async signin(dto: AuthDto) {
    try {
      // find the user by email
      const user = await this.userModel.findOne({ email: dto.email });
      // if user does not exist throw exception
      if (!user) throw new NotFoundException('User not found');
      // compare password
      const pwMatches = await argon.verify(user.password, dto.password);
      // if password incorrect throw exception
      if (!pwMatches) throw new ForbiddenException('password incorrect');
      // send back the user
      return this.signToken(String(user._id), user.email);
    } catch (error) {
      return error;
    }
  }

  async signToken(userId: string, email: string): Promise<{accessToken: string}> {
    const payload = {sub: userId, email};
    
    const token = await this.jwt.signAsync(payload,{
      expiresIn: '15m',
      secret: process.env.JWT_SECRET
    })

    return {
      accessToken: token
    }
  }
}
