import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PyqController } from './pyq.controller';
import { PyqService } from './pyq.service';

@Module({
  imports: [ConfigModule],
  controllers: [PyqController],
  providers: [PyqService],
  exports: [PyqService],
})
export class PyqModule {}
