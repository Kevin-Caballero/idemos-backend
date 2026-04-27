import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow, Initiative } from '@idemos/common';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, Initiative])],
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowsModule {}
