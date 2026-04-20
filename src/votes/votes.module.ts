import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote, OfficialVoteResult } from '@idemos/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, OfficialVoteResult])],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
