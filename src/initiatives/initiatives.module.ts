import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Initiative,
  InitiativeStep,
  InitiativeLink,
  InitiativeSummary,
  Vote,
} from '@idemos/common';
import { InitiativesService } from './initiatives.service';
import { InitiativesController } from './initiatives.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Initiative,
      InitiativeStep,
      InitiativeLink,
      InitiativeSummary,
      Vote,
    ]),
  ],
  controllers: [InitiativesController],
  providers: [InitiativesService],
})
export class InitiativesModule {}
