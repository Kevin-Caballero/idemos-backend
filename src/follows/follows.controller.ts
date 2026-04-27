import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FollowsService } from './follows.service';

@Controller()
export class FollowsController {
  private readonly logger = new Logger(FollowsController.name);

  constructor(private readonly followsService: FollowsService) {}

  @MessagePattern('follows.toggle')
  toggle(@Payload() data: { userId: string; initiativeId: string }) {
    this.logger.log(
      `[follows.toggle] user=${data.userId} initiative=${data.initiativeId}`,
    );
    return this.followsService.toggle(data.userId, data.initiativeId);
  }

  @MessagePattern('follows.isFollowing')
  isFollowing(@Payload() data: { userId: string; initiativeId: string }) {
    this.logger.log(
      `[follows.isFollowing] user=${data.userId} initiative=${data.initiativeId}`,
    );
    return this.followsService.isFollowing(data.userId, data.initiativeId);
  }

  @MessagePattern('follows.getByUser')
  getByUser(@Payload() data: { userId: string }) {
    this.logger.log(`[follows.getByUser] user=${data.userId}`);
    return this.followsService.getByUser(data.userId);
  }
}
