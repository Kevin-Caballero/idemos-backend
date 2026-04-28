import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InitiativesService } from './initiatives.service';
import { FindInitiativesDto } from './dto/find-initiatives.dto';

@Controller()
export class InitiativesController {
  private readonly logger = new Logger(InitiativesController.name);

  constructor(private readonly initiativesService: InitiativesService) {}

  @MessagePattern('initiatives.findAll')
  findAll(@Payload() dto: FindInitiativesDto) {
    this.logger.log(
      `[initiatives.findAll] type=${dto.type ?? 'all'} page=${dto.page}`,
    );
    return this.initiativesService.findAll(dto);
  }

  @MessagePattern('initiatives.findOne')
  findOne(@Payload() data: { id: string }) {
    this.logger.log(`[initiatives.findOne] id=${data.id}`);
    return this.initiativesService.findOne(data.id);
  }
}
