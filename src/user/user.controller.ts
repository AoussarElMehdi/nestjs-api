import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { User } from 'src/models/user.model';
import { GetUser } from 'src/auth/decorator';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    @Get('me')
    getMe(@GetUser() user: User) {
        return user;
    }

    @Patch('edit')
    editUser() {
        return ''
    }
}
