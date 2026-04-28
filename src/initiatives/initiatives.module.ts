import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Initiative } from '@idemos/common';
import { InitiativesService } from './initiatives.service';
import { InitiativesController } from './initiatives.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Initiative])],
  controllers: [InitiativesController],
  providers: [InitiativesService],
})
export class InitiativesModule {}
