import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from "src/schemas";
import { Request } from "express";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.REFRESH_JWT_SECRET,
            passReqToCallback: true
        })
    }

    async validate(req: Request, payload: { sub: string, email: string }) {
        const refreshToken = req.get('authorization')?.replace('Bearer', '')?.trim();
        if (!refreshToken) throw new ForbiddenException('Refresh token malformed');
        const user = await this.userModel.findById(payload.sub);
        if (!user) throw new UnauthorizedException();
        return { 
            _id: user._id,
            email: user.email,
            refreshToken: refreshToken
        };
    }
}