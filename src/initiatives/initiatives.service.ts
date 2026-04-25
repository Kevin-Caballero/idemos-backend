import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Initiative, InitiativeSummary, Vote } from '@idemos/common';
import { FindInitiativesDto } from './dto/find-initiatives.dto';

export interface PaginatedInitiatives {
  data: (Initiative & { votedChoice: string | null })[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class InitiativesService {
  private readonly logger = new Logger(InitiativesService.name);

  constructor(
    @InjectRepository(Initiative)
    private readonly repo: Repository<Initiative>,
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(InitiativeSummary)
    private readonly summaryRepo: Repository<InitiativeSummary>,
  ) {}

  async findAll(dto: FindInitiativesDto): Promise<PaginatedInitiatives> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('i')
      .orderBy('i.presentedAt', 'DESC')
      .skip(skip)
      .take(limit);

    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    // Filter to only initiatives the user has voted on
    if (dto.votedOnly && dto.userId) {
      qb.innerJoin(
        'votes',
        'uv',
        'uv.initiative_id = i.id AND uv.user_id = :votedUserId',
        { votedUserId: dto.userId },
      );
    }

    if (dto.type) {
      conditions.push('i.type = :type');
      params.type = dto.type;
    }

    if (dto.q?.trim()) {
      conditions.push(
        '(i.title ILIKE :q OR i.author ILIKE :q OR i.expediente ILIKE :q)',
      );
      params.q = `%${dto.q.trim()}%`;
    }

    if (dto.status) {
      const patterns = dto.status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (patterns.length > 0) {
        const clauses = patterns.map((_, i) => `i.currentStatus ILIKE :s${i}`);
        conditions.push(`(${clauses.join(' OR ')})`);
        patterns.forEach((p, i) => {
          params[`s${i}`] = `%${p}%`;
        });
      }
    }

    if (dto.dateFrom) {
      const from = new Date(dto.dateFrom);
      if (!isNaN(from.getTime())) {
        conditions.push('i.presentedAt >= :dateFrom');
        params.dateFrom = from;
      }
    }

    if (dto.dateTo) {
      const to = new Date(dto.dateTo);
      if (!isNaN(to.getTime())) {
        conditions.push('i.presentedAt <= :dateTo');
        params.dateTo = to;
      }
    }

    if (conditions.length > 0) {
      qb.where(conditions.join(' AND '), params);
    }

    const [data, total] = await qb.getManyAndCount();

    // Enrich with user's vote if userId was provided
    let voteMap = new Map<string, string>();
    if (dto.userId && data.length > 0) {
      const votes = await this.voteRepo
        .createQueryBuilder('v')
        .select(['v.initiativeId', 'v.choice'])
        .where('v.initiativeId IN (:...ids) AND v.userId = :userId', {
          ids: data.map((d) => d.id),
          userId: dto.userId,
        })
        .getMany();
      voteMap = new Map(votes.map((v) => [v.initiativeId, v.choice]));
    }

    const enriched = data.map((d) => ({
      ...d,
      votedChoice: (voteMap.get(d.id) as string) ?? null,
    }));

    this.logger.log(
      `[findAll] page=${page} limit=${limit} type=${dto.type ?? 'all'} → ${data.length}/${total}`,
    );

    return { data: enriched, total, page, limit };
  }

  async findOne(
    id: string,
  ): Promise<(Initiative & { summary: InitiativeSummary | null }) | null> {
    const initiative = await this.repo.findOne({
      where: { id },
      relations: { steps: true, links: true },
      order: { steps: { orderIndex: 'ASC' } },
    });
    if (!initiative) return null;
    const summary = await this.summaryRepo.findOne({
      where: { initiativeId: id },
    });
    return { ...initiative, summary: summary ?? null };
  }
}
