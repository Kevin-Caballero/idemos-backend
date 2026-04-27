import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow, Initiative } from '@idemos/common';

export interface FollowResult {
  following: boolean;
}

export interface FollowedInitiative {
  id: string;
  title: string;
  type: string;
  expediente: string;
  currentStatus: string;
  presentedAt: Date;
  followedAt: Date;
}

@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(Initiative)
    private readonly initiativeRepo: Repository<Initiative>,
  ) {}

  async toggle(userId: string, initiativeId: string): Promise<FollowResult> {
    const existing = await this.followRepo.findOneBy({ userId, initiativeId });

    if (existing) {
      await this.followRepo.delete(existing.id);
      this.logger.log(
        `[toggle] UNFOLLOW user=${userId} initiative=${initiativeId}`,
      );
      return { following: false };
    }

    await this.followRepo.save(
      this.followRepo.create({ userId, initiativeId }),
    );
    this.logger.log(
      `[toggle] FOLLOW user=${userId} initiative=${initiativeId}`,
    );
    return { following: true };
  }

  async isFollowing(
    userId: string,
    initiativeId: string,
  ): Promise<FollowResult> {
    const exists = await this.followRepo.existsBy({ userId, initiativeId });
    return { following: exists };
  }

  async getByUser(userId: string): Promise<FollowedInitiative[]> {
    const follows = await this.followRepo
      .createQueryBuilder('f')
      .innerJoin('f.initiative', 'i')
      .select([
        'f.id',
        'f.initiativeId',
        'f.createdAt',
        'i.id',
        'i.title',
        'i.type',
        'i.expediente',
        'i.currentStatus',
        'i.presentedAt',
      ])
      .where('f.user_id = :userId', { userId })
      .orderBy('f.created_at', 'DESC')
      .getMany();

    return follows.map((f) => ({
      id: f.initiative.id,
      title: f.initiative.title,
      type: f.initiative.type,
      expediente: f.initiative.expediente,
      currentStatus: f.initiative.currentStatus,
      presentedAt: f.initiative.presentedAt,
      followedAt: f.createdAt,
    }));
  }
}
