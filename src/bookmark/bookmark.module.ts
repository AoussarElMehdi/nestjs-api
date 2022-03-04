import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookMark, BookMarkSchema, User, UserSchema } from 'src/schemas';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
              { name: User.name, schema: UserSchema },
              { name: BookMark.name, schema: BookMarkSchema }
            ]
          )
    ]
})
export class BookmarkModule {}
