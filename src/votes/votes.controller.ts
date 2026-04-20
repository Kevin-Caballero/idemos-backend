import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { VotesService } from './votes.service';
import type { CastVoteDto } from './dto/cast-vote.dto';

@Controller()
export class VotesController {
  private readonly logger = new Logger(VotesController.name);

  constructor(private readonly votesService: VotesService) {}

  @MessagePattern('votes.cast')
  async castVote(@Payload() dto: CastVoteDto) {
    this.logger.log(
      `[votes.cast] user=${dto.userId} initiative=${dto.initiativeId} choice=${dto.choice}`,
    );
    try {
      return await this.votesService.castVote(dto);
    } catch (err: any) {
      throw new RpcException(err.message ?? 'Error al registrar el voto.');
    }
  }

  @MessagePattern('votes.getByUser')
  getByUser(@Payload() data: { userId: string; initiativeId: string }) {
    this.logger.log(
      `[votes.getByUser] user=${data.userId} initiative=${data.initiativeId}`,
    );
    return this.votesService.findByUser(data.userId, data.initiativeId);
  }

  @MessagePattern('votes.getStats')
  getStats(@Payload() data: { initiativeId: string }) {
    this.logger.log(`[votes.getStats] initiative=${data.initiativeId}`);
    return this.votesService.getStats(data.initiativeId);
  }
}
