import { Injectable, Logger } from '@nestjs/common';
import { QuestionContext } from './gemini-provider.service';

export enum TutorDomainStatus {
  ALLOWED = 'ALLOWED',
  REJECTED = 'REJECTED',
  AMBIGUOUS = 'AMBIGUOUS',
}

export interface DomainCheckResult {
  status: TutorDomainStatus;
  reply?: string;
  reason?: string;
}

export interface ChatMessageDto {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiTutorDomainGuardService {
  private readonly logger = new Logger(AiTutorDomainGuardService.name);

  public readonly DEFAULT_REJECT_RESPONSE =
    'Please ask a NEET-related or study-related question. I can help you with Biology, Physics, Chemistry, NEET concepts, formulas, numericals, MCQs, and exam preparation.';

  /**
   * Deterministically checks whether student message belongs to the allowed NEET/study domain BEFORE sending to LLM.
   * NO LLM calls are made inside this classification service.
   */
  checkDomain(
    rawMessage: string,
    context?: QuestionContext,
    history: ChatMessageDto[] = [],
  ): DomainCheckResult {
    if (!rawMessage || typeof rawMessage !== 'string') {
      return {
        status: TutorDomainStatus.REJECTED,
        reply: this.DEFAULT_REJECT_RESPONSE,
        reason: 'Empty message payload',
      };
    }

    const msg = rawMessage.trim();
    if (msg.length === 0) {
      return {
        status: TutorDomainStatus.REJECTED,
        reply: this.DEFAULT_REJECT_RESPONSE,
        reason: 'Empty message string',
      };
    }

    // ── 1. CHECK FOR EXPLICIT NEET/STUDY OVERRIDE FRAMING ──────────────────────
    // If user explicitly mentions NEET/study framing (e.g. "is this relevant to NEET?", "in NEET physics", "while preparing for NEET"),
    // allow immediately unless it's pure non-academic spam.
    const explicitNeetFraming =
      /\b(?:neet|ncert|nta|cbse|aipmt|mbbs|bds|exam|marks?|cutoff|rank|revision|schedule|routine|backlog|mock\s*test|practice\s*test|study|padikanum|prepare|preparation|syllabus|coaching)\b/i.test(
        msg,
      );

    // ── 2. BLACKLIST / UNRELATED DOMAINS CHECK ─────────────────────────────────
    // Keywords for topics that MUST be rejected if NOT explicitly framed in NEET/study academic context.
    const containsSports =
      /\b(?:cricket|ipl|raina|suresh\s*raina|virat|kohli|dhoni|rohit|sachin|football|messi|ronaldo|match|score|kabaddi|tennis|badminton|fifa|nba|olympics|world\s*cup)\b/i.test(
        msg,
      );

    const containsEntertainment =
      /\b(?:movie|cinema|actor|actress|shah\s*rukh|srk|vijay|ajith|rajini|kamal|netflix|trailer|song|singing|dance|joke|story|birthday\s*wish|birthday\s*message|comedy|funny)\b/i.test(
        msg,
      );

    const containsGeneralUnrelated =
      /\b(?:weather|rain\s*today|forecast|bitcoin|crypto|cryptocurrency|politics|election|government|prime\s*minister|president|elon\s*musk|instagram|tiktok|whatsapp|facebook|youtube\s*channel|best\s*phone|laptop\s*under|buy\s*online|amazon|flipkart|travel|vacation|flight|hotel|restaurant|food|eat\s*today)\b/i.test(
        msg,
      );

    const containsGeneralCoding =
      /\b(?:python\s*code|python\s*program|write\s*a\s*python|javascript\s*code|html\s*code|css\s*code|react\s*code|java\s*program|c\+\+\s*code|sql\s*query|bash\s*script)\b/i.test(
        msg,
      );

    const containsUnrelatedLifeAdvice =
      /^(?:what\s+should\s+i\s+eat|where\s+should\s+i\s+travel|enaku\s+life\s+la\s+ena\s+panradhu|i\s+feel\s+lazy\s+today\s+what\s+should\s+i\s+do|tell\s+me\s+a\s+story|tell\s+me\s+a\s+joke)\??$/i.test(
        msg,
      );

    const isUnrelatedTopic =
      containsSports ||
      containsEntertainment ||
      containsGeneralUnrelated ||
      containsGeneralCoding ||
      containsUnrelatedLifeAdvice;

    if (isUnrelatedTopic && !explicitNeetFraming) {
      this.logger.log(`DOMAIN_GUARD=REJECTED Message="${msg}" Reason="Blacklisted unrelated topic"`);
      return {
        status: TutorDomainStatus.REJECTED,
        reply: this.DEFAULT_REJECT_RESPONSE,
        reason: 'Unrelated domain matched',
      };
    }

    // ── 3. EXPLICIT ACADEMIC KEYWORDS & PATTERNS (BIOLOGY, PHYSICS, CHEMISTRY, MATH/NUMERICAL) ──
    const biologyKeywords =
      /\b(?:glycogenesis|glycogenolysis|gluconeogenesis|glycolysis|glycogen|glucose|glut4|pancreas|islets|langerhans|pyruvate|atp|adp|amp|anabolism|catabolism|metabolism|cell|tissue|organ|gene|genetics|dna|rna|mitosis|meiosis|chromosome|allele|mendel|insulin|glucagon|hormone|enzyme|protein|amino|lipid|carbohydrate|photosynthesis|respiration|transpiration|xylem|phloem|heart|blood|kidney|nephron|neuron|brain|cortex|plant|flower|seed|botany|zoology|ecology|ecosystem|biodiversity|taxonomy|kingdom|phylum|class|order|family|genus|species|bacteria|virus|fungus|disease|immunity|antibody|antigen|ribosome|mitochondria|chloroplast|membrane|epithelium|digestion|circulation|excretion|reproduction|gamete|zygote|embryo|biotechnology|plasmid|vector|pcr|electrophoresis|evolution|darwin|lamarck|physiolog(?:y|ical)|anatom(?:y|ical)|human|medical)\b/i;

    const physicsKeywords =
      /\b(?:force|mass|acceleration|velocity|speed|displacement|distance|momentum|energy|kinetic|potential|work|power|gravity|gravitation|newton|newton's|friction|motion|projectile|circular|rotation|torque|moment\s*of\s*inertia|optics|lens|mirror|refraction|reflection|ray|wave|frequency|wavelength|interference|diffraction|electric|charge|coulomb|current|voltage|resistance|ohm|ampere|volt|circuit|capacitor|capacitance|magnetic|field|flux|induction|faraday|thermodynamics|heat|temperature|pressure|entropy|enthalpy|ideal\s*gas|carnot|modern\s*physics|atom|atomic|nucleus|nuclear|photoelectric|semiconductor|diode|transistor|logic\s*gate|dimension|dimensional|unit|vector|scalar|sum|calculate|solve|formula|equation)\b/i;

    const chemistryKeywords =
      /\b(?:atom|atomic|mole|molar|molarity|molality|normality|solution|solute|solvent|concentration|acid|base|ph|poh|buffer|titration|equilibrium|le\s*chatelier|redox|oxidation|reduction|reaction|chemical|reactant|product|catalyst|periodic|element|compound|metal|nonmetal|metalloid|organic|inorganic|physical\s*chemistry|iupac|isomer|isomerism|hydrocarbon|alkane|alkene|alkyne|alcohol|ether|aldehyde|ketone|carboxylic|ester|amine|amide|phenol|benzene|sn1|sn2|e1|e2|electrophile|nucleophile|thermodynamics|kinetics|rate\s*law|electrochemistry|electrode|galvanic|electrolytic|coordination|complex|ligand|polymer|biomodule|biomolecule|hybridization|bond|bonding|orbital|vsepr|resonance|h2o|co2|nacl|h2so4|c6h6|nh3|o2|n2|hcl|naoh|ch4|h3po4|hno3|water)\b/i;

    const mathAndNumericals =
      /(?:[\d\.\+x\-\*\/\^=]{3,}|calculate|solve|find|value|equation|\d+\s*(?:kg|g|m\/s|m\/s\^2|n|j|w|v|a|c|m|cm|mm|hz|mol|pa|atm|bar|k|cal|ev|v\/m|t|wb))\b/i;

    const studyAndStrategyKeywords =
      /\b(?:prepare|preparation|schedule|routine|strategy|study|padikanum|how\s+to\s+study|revision|revise|important\s*topics|weightage|mock|mcq|mcqs|quiz|question|option|solution|explanation|reason|formula|derivation|numerical)\b/i;

    const isAcademicKeywordPresent =
      biologyKeywords.test(msg) ||
      physicsKeywords.test(msg) ||
      chemistryKeywords.test(msg) ||
      mathAndNumericals.test(msg) ||
      studyAndStrategyKeywords.test(msg);

    if (isAcademicKeywordPresent || explicitNeetFraming) {
      return { status: TutorDomainStatus.ALLOWED };
    }

    // ── 4. CASUAL & TANGLISH ACADEMIC PATTERNS ──────────────────────────────
    const tanglishAcademicPatterns =
      /\b(?:na\s*ena|ena|puriyala|explain\s*panu|sollu|solra|epdi|vandhuchu|wrong|correct|sum|problem|answer|option|formula|chapter|topic|subject|important|padikanuma|work\s*aagum|rendukum|matum|kaatu|illai)\b/i.test(
        msg,
      );

    if (tanglishAcademicPatterns) {
      return { status: TutorDomainStatus.ALLOWED };
    }

    // ── 5. FOLLOW-UP & AMBIGUOUS CONTEXT RESOLUTION ───────────────────────────
    // Short phrases (e.g. "why?", "how?", "apo?", "adhu?", "that one?", "option A?", "correct ah?", "formula matum sollu")
    const isShortFollowupPattern =
      /^(?:why\??|how\??|apo\??|adhu\??|that\s*one\??|rendukum\??|option\s*[a-d]\??|correct\s*ah\??|formula\s*matum\s*sollu|explain\??|detailed\s*ah\s*explain\s*panu|step\s*by\s*step|solution|confirm)\b/i.test(
        msg,
      );

    // Check if there is active academic context from either the current question OR history
    const hasQuestionContext =
      Boolean(context?.questionText && context.questionText.trim().length > 0) ||
      Boolean(context?.subject && context.subject.toLowerCase() !== 'general');

    const hasAcademicHistory = history.some((h) => {
      const c = h.content.toLowerCase();
      return (
        biologyKeywords.test(c) ||
        physicsKeywords.test(c) ||
        chemistryKeywords.test(c) ||
        explicitNeetFraming ||
        c.includes('question') ||
        c.includes('option')
      );
    });

    if (isShortFollowupPattern && (hasQuestionContext || hasAcademicHistory)) {
      return { status: TutorDomainStatus.ALLOWED };
    }

    if (isShortFollowupPattern) {
      return { status: TutorDomainStatus.ALLOWED };
    }

    // ── 6. DEFAULT SAFETY FALLBACK FOR COMPLETELY UNRELATED CHAT ──────────────
    // If the message contains no academic terms, no NEET terms, no study strategy, no math, no question context match:
    // Reject it deterministically as per Spec Section 1 & 2.
    this.logger.log(`DOMAIN_GUARD=REJECTED Message="${msg}" Reason="No academic or study intent detected"`);
    return {
      status: TutorDomainStatus.REJECTED,
      reply: this.DEFAULT_REJECT_RESPONSE,
      reason: 'No academic or NEET domain matched',
    };
  }
}
