import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Initiative, InitiativeType } from '@idemos/common';
import { InitiativesService } from './initiatives.service';

const mockInitiative: Partial<Initiative> = {
  id: 'uuid-1',
  source: 'CONGRESO',
  legislature: 'XV',
  type: InitiativeType.Proyecto,
  expediente: '160/000001',
  title: 'Proyecto de Ley de Test',
  author: 'Gobierno',
  procedureType: 'Ordinaria',
  currentStatus: 'En tramitación',
  committee: null,
  presentedAt: new Date('2023-01-01'),
  qualifiedAt: null,
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('InitiativesService', () => {
  let service: InitiativesService;

  const mockQb = {
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.createQueryBuilder.mockReturnValue(mockQb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiativesService,
        { provide: getRepositoryToken(Initiative), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<InitiativesService>(InitiativesService);
  });

  describe('findAll', () => {
    it('returns paginated results without type filter', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockInitiative], 1]);

      const result = await service.findAll({});

      expect(mockQb.where).not.toHaveBeenCalled();
      expect(result).toEqual({
        data: [mockInitiative],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('applies type filter when provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockInitiative], 1]);

      await service.findAll({ type: InitiativeType.Proyecto });

      expect(mockQb.where).toHaveBeenCalledWith('i.type = :type', {
        type: InitiativeType.Proyecto,
      });
    });

    it('applies correct pagination skip for page 3 limit 10', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockQb.skip).toHaveBeenCalledWith(20);
      expect(mockQb.take).toHaveBeenCalledWith(10);
    });

    it('defaults to page=1 and limit=20 when not provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(20);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('returns correct total and data count', async () => {
      mockQb.getManyAndCount.mockResolvedValue([
        [mockInitiative, mockInitiative],
        2,
      ]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('applies search filter on title, author and expediente when q is provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockInitiative], 1]);

      await service.findAll({ q: 'presupuestos' });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.title ILIKE :q'),
        expect.objectContaining({ q: '%presupuestos%' }),
      );
    });

    it('trims whitespace from q before building ILIKE pattern', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ q: '  ley  ' });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ q: '%ley%' }),
      );
    });

    it('does not apply search filter when q is empty string', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ q: '' });

      expect(mockQb.where).not.toHaveBeenCalled();
    });

    it('combines type and q filters with AND', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockInitiative], 1]);

      await service.findAll({ type: InitiativeType.Proyecto, q: 'ley' });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.type = :type'),
        expect.objectContaining({ type: InitiativeType.Proyecto, q: '%ley%' }),
      );
      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.title ILIKE :q'),
        expect.any(Object),
      );
    });

    it('applies single status ILIKE filter when status is provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockInitiative], 1]);

      await service.findAll({ status: 'aprobad' });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.currentStatus ILIKE :s0'),
        expect.objectContaining({ s0: '%aprobad%' }),
      );
    });

    it('applies multiple status ILIKE OR conditions for comma-separated status', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockInitiative], 1]);

      await service.findAll({ status: 'aprobad,rechazad' });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.currentStatus ILIKE :s0'),
        expect.objectContaining({ s0: '%aprobad%', s1: '%rechazad%' }),
      );
      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.currentStatus ILIKE :s1'),
        expect.any(Object),
      );
    });

    it('applies dateFrom condition when valid ISO date is provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ dateFrom: '2024-01-01' });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.presentedAt >= :dateFrom'),
        expect.objectContaining({ dateFrom: new Date('2024-01-01') }),
      );
    });

    it('applies dateTo condition when valid ISO date is provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ dateTo: '2024-12-31' });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining('i.presentedAt <= :dateTo'),
        expect.objectContaining({ dateTo: new Date('2024-12-31') }),
      );
    });

    it('combines q, status, and date filters with AND', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockInitiative], 1]);

      await service.findAll({
        q: 'presupuesto',
        status: 'aprobad',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      });

      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringMatching(
          /i\.title ILIKE :q.*i\.currentStatus ILIKE :s0.*i\.presentedAt >= :dateFrom.*i\.presentedAt <= :dateTo/s,
        ),
        expect.objectContaining({
          q: '%presupuesto%',
          s0: '%aprobad%',
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-12-31'),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns initiative when found', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockInitiative);

      const result = await service.findOne('uuid-1');

      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(mockInitiative);
    });

    it('returns null when initiative not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('uuid-999');

      expect(result).toBeNull();
    });
  });
});
