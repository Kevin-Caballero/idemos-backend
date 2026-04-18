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

    if (dto.type) {
      qb.where('i.type = :type', { type: dto.type });
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
