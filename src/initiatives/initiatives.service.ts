import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Initiative } from '@idemos/common';
import { FindInitiativesDto } from './dto/find-initiatives.dto';

export interface PaginatedInitiatives {
  data: Initiative[];
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

    this.logger.log(
      `[findAll] page=${page} limit=${limit} type=${dto.type ?? 'all'} → ${data.length}/${total}`,
    );

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Initiative | null> {
    return this.repo.findOneBy({ id });
  }
}
