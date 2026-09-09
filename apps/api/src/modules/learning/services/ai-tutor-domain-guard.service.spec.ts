import { Test, TestingModule } from '@nestjs/testing';
import {
  AiTutorDomainGuardService,
  TutorDomainStatus,
} from './ai-tutor-domain-guard.service';
import { QuestionContext } from './gemini-provider.service';

describe('AiTutorDomainGuardService (NEET Master Domain Guard)', () => {
  let service: AiTutorDomainGuardService;

  const mockBiologyContext: QuestionContext = {
    questionText: 'Which hormone lowers blood glucose level?',
    options: [
      { label: 'A', text: 'Glucagon', isCorrect: false },
      { label: 'B', text: 'Thyroxine', isCorrect: false },
      { label: 'C', text: 'Insulin', isCorrect: true },
      { label: 'D', text: 'Adrenaline', isCorrect: false },
    ],
    correctOptionLabel: 'C',
    selectedOption: 'C',
    subject: 'Biology',
    chapter: 'Human Physiology',
    staticExplanationText: 'Insulin facilitates glucose cellular uptake.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiTutorDomainGuardService],
    }).compile();

    service = module.get<AiTutorDomainGuardService>(AiTutorDomainGuardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── TEST CASES MANDATED BY MASTER PROMPT SECTION 21 ─────────────────────────

  it('CASE 1: Current question = Insulin, User = "cricket player raina yaru?" -> REJECT', () => {
    const res = service.checkDomain('cricket player raina yaru?', mockBiologyContext);
    expect(res.status).toBe(TutorDomainStatus.REJECTED);
    expect(res.reply).toBe(service.DEFAULT_REJECT_RESPONSE);
  });

  it('CASE 2: "insulin na ena?" -> ALLOW', () => {
    const res = service.checkDomain('insulin na ena?');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 3: "why insulin lowers blood glucose?" -> ALLOW', () => {
    const res = service.checkDomain('why insulin lowers blood glucose?');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 4: "apo insulin dha correct ah?" -> ALLOW', () => {
    const res = service.checkDomain('apo insulin dha correct ah?');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 5: "2kg mass velocity 5 calculate kinetic energy" -> ALLOW', () => {
    const res = service.checkDomain('2kg mass velocity 5 calculate kinetic energy');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 6: "2x + 5 = 15 solve" -> ALLOW', () => {
    const res = service.checkDomain('2x + 5 = 15 solve');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 7: "formula matum sollu" with academic context -> ALLOW', () => {
    const res = service.checkDomain('formula matum sollu', mockBiologyContext);
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 8: "latest IPL score enna?" -> REJECT', () => {
    const res = service.checkDomain('latest IPL score enna?');
    expect(res.status).toBe(TutorDomainStatus.REJECTED);
    expect(res.reply).toBe(service.DEFAULT_REJECT_RESPONSE);
  });

  it('CASE 9: "weather today?" -> REJECT', () => {
    const res = service.checkDomain('weather today?');
    expect(res.status).toBe(TutorDomainStatus.REJECTED);
    expect(res.reply).toBe(service.DEFAULT_REJECT_RESPONSE);
  });

  it('CASE 10: "Who is Raina?" -> REJECT', () => {
    const res = service.checkDomain('Who is Raina?');
    expect(res.status).toBe(TutorDomainStatus.REJECTED);
    expect(res.reply).toBe(service.DEFAULT_REJECT_RESPONSE);
  });

  it('CASE 11: "NEET physics la Newton second law explain panu" -> ALLOW', () => {
    const res = service.checkDomain('NEET physics la Newton second law explain panu');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 12: "NEET ku human physiology important ah?" -> ALLOW', () => {
    const res = service.checkDomain('NEET ku human physiology important ah?');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 13: "puriyala" with academic context -> ALLOW', () => {
    const res = service.checkDomain('puriyala', mockBiologyContext);
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 14: "why?" with academic context -> ALLOW', () => {
    const res = service.checkDomain('why?', mockBiologyContext);
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 15: "movie recommend panu" -> REJECT', () => {
    const res = service.checkDomain('movie recommend panu');
    expect(res.status).toBe(TutorDomainStatus.REJECTED);
    expect(res.reply).toBe(service.DEFAULT_REJECT_RESPONSE);
  });

  it('CASE 16: "give me python code" -> REJECT', () => {
    const res = service.checkDomain('give me python code');
    expect(res.status).toBe(TutorDomainStatus.REJECTED);
    expect(res.reply).toBe(service.DEFAULT_REJECT_RESPONSE);
  });

  it('CASE 17: "NEET preparation schedule epdi create panradhu?" -> ALLOW', () => {
    const res = service.checkDomain('NEET preparation schedule epdi create panradhu?');
    expect(res.status).toBe(TutorDomainStatus.ALLOWED);
  });

  it('CASE 18: "enaku life la ena panradhu?" -> REJECT', () => {
    const res = service.checkDomain('enaku life la ena panradhu?');
    expect(res.status).toBe(TutorDomainStatus.REJECTED);
    expect(res.reply).toBe(service.DEFAULT_REJECT_RESPONSE);
  });
});
