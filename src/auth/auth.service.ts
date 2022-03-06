import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/schemas';
import { Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private jwt: JwtService
  ) { }

  async signup(dto: AuthDto) {
    try {
      // generate the password hash
      const hash = await argon.hash(dto.password);
      // save the new user in the db
      const newUser = new this.userModel({
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        email: dto.email,
        password: hash
      });
      // save the user
      const user = await newUser.save();
      // generate access & refresh tokens
      const tokens = await this.getTokens(String(user._id), user.email);
      // save the hash of refresh token
      await this.updateHashOfRefreshToken(String(user._id), tokens.refreshToken); 
      // send back the tokens
      return tokens;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('email already taken');
      }
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
      // generate access & refresh tokens
      const tokens = await this.getTokens(String(user._id), user.email);
      // save the hash of refresh token
      await this.updateHashOfRefreshToken(String(user._id), tokens.refreshToken); 
      // send back the tokens
      return tokens;
    } catch (error) {
      return error;
    }
  }

  async logout(userId: string) {
    // find the user by email
    const user = await this.userModel.findOne({ _id: userId });
    // if user does not exist throw exception
    if (!user) throw new NotFoundException('User not found');
    user.refreshTokenHash = null;
    await user.save();
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // find the user by email
    const user = await this.userModel.findOne({ _id: userId });
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException('Access Denied');
    // compare refresh tokens
    const rtMatches = await argon.verify(user.refreshTokenHash, refreshToken);
    // if token incorrect throw exception
    if (!rtMatches) throw new ForbiddenException('Access Denied');
    // generate access & refresh tokens
    const tokens = await this.getTokens(String(user._id), user.email);
    // save the hash of refresh token
    await this.updateHashOfRefreshToken(String(user._id), tokens.refreshToken); 
    // send back the tokens
    return tokens;
  }

  async getTokens(userId: string, email: string): Promise<Tokens> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: 60 * 15,
        secret: process.env.ACCESS_JWT_SECRET
      }),
      this.jwt.signAsync(payload, {
        expiresIn: 60 * 60 * 24 * 7,
        secret: process.env.REFRESH_JWT_SECRET
      })
    ])

    return {
      accessToken,
      refreshToken
    }
  }

  async updateHashOfRefreshToken(userId: string, refreshToken: string){
    const hashOfRefreshToken = await argon.hash(refreshToken);
    // find the user by id
    const user = await this.userModel.findOne({ _id: userId });
    user.refreshTokenHash = hashOfRefreshToken;
    user.save();
  }
}
