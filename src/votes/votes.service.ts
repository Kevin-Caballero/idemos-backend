import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote, VoteChoice, OfficialVoteResult } from '@idemos/common';
import { CastVoteDto, VoteStats } from './dto/cast-vote.dto';

@Injectable()
export class VotesService {
  private readonly logger = new Logger(VotesService.name);

  constructor(
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(OfficialVoteResult)
    private readonly officialRepo: Repository<OfficialVoteResult>,
  ) {}

  async castVote(dto: CastVoteDto): Promise<Vote> {
    const existing = await this.voteRepo.findOneBy({
      userId: dto.userId,
      initiativeId: dto.initiativeId,
    });

    if (existing) {
      existing.choice = dto.choice;
      const updated = await this.voteRepo.save(existing);
      this.logger.log(
        `[castVote] UPDATED user=${dto.userId} initiative=${dto.initiativeId} choice=${dto.choice}`,
      );
      return updated;
    }

    const vote = this.voteRepo.create({
      userId: dto.userId,
      initiativeId: dto.initiativeId,
      choice: dto.choice,
    });

    const saved = await this.voteRepo.save(vote);
    this.logger.log(
      `[castVote] CREATED user=${dto.userId} initiative=${dto.initiativeId} choice=${dto.choice}`,
    );
    return saved;
  }

  async findByUser(userId: string, initiativeId: string): Promise<Vote | null> {
    return this.voteRepo.findOneBy({ userId, initiativeId });
  }

  async getStats(initiativeId: string): Promise<VoteStats> {
    const counts = await this.voteRepo
      .createQueryBuilder('v')
      .select('v.choice', 'choice')
      .addSelect('COUNT(*)', 'count')
      .where('v.initiative_id = :initiativeId', { initiativeId })
      .groupBy('v.choice')
      .getRawMany<{ choice: VoteChoice; count: string }>();

    const si = Number(
      counts.find((r) => r.choice === VoteChoice.SI)?.count ?? 0,
    );
    const no = Number(
      counts.find((r) => r.choice === VoteChoice.NO)?.count ?? 0,
    );
    const abst = Number(
      counts.find((r) => r.choice === VoteChoice.ABST)?.count ?? 0,
    );

    const official = await this.officialRepo.findOneBy({ initiativeId });

    return {
      si,
      no,
      abst,
      total: si + no + abst,
      officialYes: official?.yesCount ?? null,
      officialNo: official?.noCount ?? null,
      officialAbst: official?.abstentionCount ?? null,
      officialVotedAt: official?.votedAt
        ? new Date(official.votedAt).toISOString().slice(0, 10)
        : null,
    };
  }
}
