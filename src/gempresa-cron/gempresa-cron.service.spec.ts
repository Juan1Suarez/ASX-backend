import { Test, TestingModule } from '@nestjs/testing';
import { GempresaCronService } from './gempresa-cron.service';

describe('GempresaCronService', () => {
  let service: GempresaCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GempresaCronService],
    }).compile();

    service = module.get<GempresaCronService>(GempresaCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
