import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiProviderService, QuestionContext } from './gemini-provider.service';

describe('GeminiProviderService (Runtime Natural Chat & Intent Engine Test Matrix)', () => {
  let service: GeminiProviderService;

  const mockInsulinContext: QuestionContext = {
    questionText: 'Which hormone lowers blood glucose level?',
    options: [
      { label: 'A', text: 'Glucagon', isCorrect: false },
      { label: 'B', text: 'Thyroxine', isCorrect: false },
      { label: 'C', text: 'Insulin', isCorrect: true },
      { label: 'D', text: 'Adrenaline', isCorrect: false },
    ],
    correctOptionLabel: 'C',
    selectedOption: 'A',
    subject: 'Biology',
    chapter: 'Human Physiology',
    staticExplanationText: 'Insulin facilitates cellular uptake of glucose.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiProviderService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'GEMINI_API_KEY') return ''; // Force local fallback testing
              if (key === 'OPENROUTER_API_KEY') return '';
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get<GeminiProviderService>(GeminiProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── GOLDEN ACCEPTANCE TEST (USER SPEC) ────────────────────────────────────
  it('GOLDEN ACCEPTANCE TEST: "dna na ena da" -> Natural Tanglish DNA answer (Zero generic academic template)', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'dna na ena da', []);
    expect(res.reply).toContain('DNA na Deoxyribonucleic Acid da');
    expect(res.reply).toContain('genetic information');
    expect(res.reply).not.toContain('Academic Concept');
    expect(res.reply).not.toContain('Core Principle');
    expect(res.reply).not.toContain('Key Concept');
    expect(res.reply).not.toContain('Summary');
    expect(res.reply).not.toContain('In NEET Class 11 & 12 NCERT curriculum');
    expect(res.reply).not.toContain('Option C');
    expect(res.reply).not.toContain('insulin');
  });

  // ── GOLDEN REGRESSION TEST ────────────────────────────────────────────────
  it('GOLDEN REGRESSION TEST: "solve pani katu da indha questiona" -> SOLVES THE MCQ DIRECTLY (Zero generic boilerplate)', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'solve pani katu da indha questiona', []);
    expect(res.reply).toContain('Here is the step-by-step solution for this question');
    expect(res.reply).toContain('Option C');
    expect(res.reply).not.toContain('Academic Concept');
    expect(res.reply).not.toContain('Core Principle');
    expect(res.reply).not.toContain('Key Concept');
    expect(res.reply).not.toContain('Summary');
  });

  // ── REQUIRED TEST MATRIX ──────────────────────────────────────────────────

  it('TEST 1: "insulin sugar increase panum ah?" -> Illa da ❌ + Insulin lowers blood glucose', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'insulin sugar increase panum ah?', []);
    expect(res.reply).toContain('Illa da');
    expect(res.reply.toLowerCase()).toContain('decrease');
    expect(res.reply).not.toContain('Academic Concept');
  });

  it('TEST 2: "glycogenesis apdi na ena da?" -> Definition of glycogenesis only (Glucose -> Glycogen)', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'glycogenesis apdi na ena da?', []);
    expect(res.reply.toLowerCase()).toContain('glycogenesis');
    expect(res.reply).toContain('Glucose');
    expect(res.reply).toContain('Glycogen');
    expect(res.reply).not.toContain('Option C');
  });

  it('TEST 3: "why?" -> Why insulin lowers blood glucose', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'why?', []);
    expect(res.reply.toLowerCase()).toContain('insulin');
  });

  it('TEST 4: "konja detailed ah explain panu" -> Detailed explanation', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'konja detailed ah explain panu', []);
    expect(res.reply.toLowerCase()).toContain('insulin');
    expect(res.reply.toLowerCase()).toContain('glucose');
  });

  it('TEST 5: "apo insulin dha correct ah?" -> Short confirmation', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'apo insulin dha correct ah?', []);
    expect(res.reply.toLowerCase()).toContain('insulin');
    expect(res.reply.toLowerCase()).toContain('correct');
  });

  it('TEST 6: "why glucagon wrong?" -> Option A (Glucagon) explanation', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'why glucagon wrong?', []);
    expect(res.reply).toContain('Glucagon');
    expect(res.reply.toLowerCase()).toContain('raises');
  });

  it('TEST 7: "rendukum difference matum slu" -> Comparison between Insulin and Glucagon', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'rendukum difference matum slu', []);
    expect(res.reply).toContain('Comparison');
    expect(res.reply).toContain('Insulin');
    expect(res.reply).toContain('Glucagon');
  });

  it('TEST 8: "H2O na ena?" -> H2O explanation only', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'H2O na ena?', []);
    expect(res.reply).toContain('H2O');
    expect(res.reply.toLowerCase()).not.toContain('insulin');
  });

  it('TEST 9: "Newton second law formula enna?" -> F = ma formula', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'Newton second law formula enna?', []);
    expect(res.reply).toContain('Newton');
    expect(res.reply).toContain('F = m');
  });

  it('TEST 10: "2kg mass 5m/s velocity kinetic energy calculate" -> 25 J calculation', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, '2kg mass 5m/s velocity kinetic energy calculate', []);
    expect(res.reply).toContain('25');
  });

  it('TEST 11: "x² + 5x + 6 = 0 solve" -> Algebraic solution x = -2, -3', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'x² + 5x + 6 = 0 solve', []);
    expect(res.reply).toContain('x = -2');
    expect(res.reply).toContain('x = -3');
  });

  it('TEST 12: "photosynthesis epdi nadakuthu?" -> Photosynthesis explanation', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'photosynthesis epdi nadakuthu?', []);
    expect(res.reply.toLowerCase()).toContain('photosynthesis');
  });

  it('TEST 13: "benzene structure explain" -> Benzene explanation', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'benzene structure explain', []);
    expect(res.reply).toContain('Benzene');
  });

  it('TEST 14: "formula matum slu" -> Formula only', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'formula matum slu', []);
    expect(res.reply).toContain('Option C');
  });

  it('TEST 15: "deep ah detailed ah explain panu" -> Deep explanation', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'deep ah detailed ah explain panu', []);
    expect(res.reply.toLowerCase()).toContain('insulin');
  });

  it('TEST 16: "short ah slu" -> Short answer', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'short ah slu', []);
    expect(res.reply.toLowerCase()).toContain('insulin');
  });

  it('RESPONSE VALIDATOR CHECK: No generic boilerplate allowed anywhere', async () => {
    const res = await service.generateChatFollowup(mockInsulinContext, 'random query', []);
    expect(res.reply).not.toContain('Academic Concept');
    expect(res.reply).not.toContain('Core Principle');
    expect(res.reply).not.toContain('Key Concept');
    expect(res.reply).not.toContain('Summary');
    expect(res.reply).not.toContain('In NEET Class 11 & 12 NCERT curriculum');
  });
});
