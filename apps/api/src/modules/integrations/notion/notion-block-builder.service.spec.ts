import { NotionBlockBuilderService } from './notion-block-builder.service';
import { RecordedClassStudyNotes } from '../../live/types/recorded-class-ai.types';

describe('NotionBlockBuilderService', () => {
  let service: NotionBlockBuilderService;

  const mockNotes: RecordedClassStudyNotes = {
    lecture: {
      title: 'Human Physiology: Neural Control & Coordination',
      language: 'English',
      durationSeconds: 3600,
      overview: 'Comprehensive lecture covering the generation and conduction of nerve impulses.',
      learningObjectives: [
        'Understand polarized, depolarized and hyperpolarized states',
        'Learn chemical synapse mechanism and neurotransmitters',
      ],
    },
    transcript: {
      segments: [
        {
          startSeconds: 0,
          endSeconds: 60,
          timestampLabel: '00:00 - 01:00',
          text: 'Welcome students to Neural Control.',
        },
      ],
    },
    topics: [
      {
        title: 'Resting Membrane Potential',
        startSeconds: 0,
        endSeconds: 300,
        timestampLabel: '00:05:00',
        explanation: 'The axonal membrane is more permeable to K+ and nearly impermeable to Na+.',
        subtopics: ['Axolemma permeability', 'Sodium potassium pump action'],
        definitions: [],
        concepts: [],
        formulas: [],
        examples: [],
        neetExamPoints: [],
        confidence: 0.95,
      },
    ],
    importantConcepts: [
      {
        title: 'All-or-None Principle',
        category: 'PRINCIPLE',
        explanation: 'Once threshold stimulus (-55mV) is reached, action potential fires at full magnitude.',
        neetRelevance: 'Amplitude of action potential does not depend on stimulus strength.',
      },
    ],
    definitions: [
      {
        term: 'Refractory Period',
        definition: 'The brief period during which a neuron cannot fire another action potential.',
        explanation: 'Absolute = Absolutely impossible; Relative = Requires stronger stimulus.',
      },
    ],
    formulaCheatSheet: [
      {
        name: 'Nernst Equilibrium Potential',
        expression: 'E = (RT/zF) * ln([Ion]_out / [Ion]_in)',
        variableExplanations: 'R = gas constant, T = absolute temperature, z = valence of ion, F = Faraday constant',
        siUnits: 'Volts (V) or Millivolts (mV)',
      },
    ],
    neetExamPoints: [
      {
        point: '3 Na+ ions are transported outwards for every 2 K+ ions imported by the Na+/K+ ATPase pump.',
        relevance: 'CRITICAL',
        potentialQuestionAngle: 'Direct question on active transport stoichiometry and electrogenic nature.',
      },
    ],
    workedExamples: [
      {
        problem: 'Calculate net charge transfer across axolemma for 100 Na+/K+ pump cycles.',
        stepByStepExplanation: [
          'Each pump cycle transports 3 Na+ out (+3) and 2 K+ in (+2).',
          'Net transfer per cycle: +1 positive charge out.',
          'For 100 cycles: +100 elementary positive charges exported.',
        ],
        finalResult: '+100 e (Positive outward)',
      },
    ],
    lectureConclusion: {
      summary: 'Mastered nerve impulse initiation, propagation, and synaptic transmission.',
      revisionChecklist: [
        'Memorize resting membrane potential value (-70 mV)',
        'Understand synaptic vesicle exocytosis triggered by Ca2+ influx',
      ],
      homework: [
        'Practice 20 PYQ questions on neuron transmission',
      ],
    },
    quality: {
      completenessScore: 98,
      uncertainSections: [],
      warnings: [],
    },
    metadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      analyzedAt: '2026-11-23T08:00:00Z',
      subjectName: 'Biology',
      chapterName: 'Human Physiology',
      topicName: 'Synaptic Transmission & Action Potential',
      tutorName: 'Dr. Ramesh Kumar',
    },
  };

  beforeEach(() => {
    service = new NotionBlockBuilderService();
  });

  describe('buildStudyNotesBlocks', () => {
    it('should generate complete hierarchy of Notion blocks conforming to API 2022-06-28', () => {
      const blocks = service.buildStudyNotesBlocks(mockNotes, {
        recordingId: 'rec-123',
        version: 2,
      });

      expect(blocks.length).toBeGreaterThan(15);

      // 1. Top Callout Banner
      const banner = blocks[0];
      expect(banner.type).toBe('callout');
      expect(banner.callout.icon.emoji).toBe('🩺');
      expect(banner.callout.color).toBe('blue_background');

      // 2. Table of Contents
      const toc = blocks.find((b) => b.type === 'table_of_contents');
      expect(toc).toBeDefined();

      // 3. Synopsis & Learning Objectives
      const synopsisHeading = blocks.find(
        (b) => b.type === 'heading_2' && b.heading_2.rich_text[0].text.content.includes('Synopsis'),
      );
      expect(synopsisHeading).toBeDefined();

      const objectives = blocks.filter((b) => b.type === 'bulleted_list_item');
      expect(objectives.length).toBeGreaterThanOrEqual(2);

      // 4. Timestamped topics
      const topicHeading = blocks.find(
        (b) => b.type === 'heading_3' && b.heading_3.rich_text[0].text.content.includes('[00:05:00]'),
      );
      expect(topicHeading).toBeDefined();

      // 5. Definitions (quote blocks)
      const quoteBlock = blocks.find((b) => b.type === 'quote');
      expect(quoteBlock).toBeDefined();
      expect(quoteBlock?.quote.rich_text[0].text.content).toContain('Refractory Period:');

      // 6. Formula cheat sheet (code blocks)
      const codeBlock = blocks.find((b) => b.type === 'code');
      expect(codeBlock).toBeDefined();
      expect(codeBlock?.code.rich_text[0].text.content).toContain('E = (RT/zF)');

      // 7. High-Yield Exam Points
      const examPointCallout = blocks.find(
        (b) =>
          b.type === 'callout' &&
          b.callout.rich_text[0].text.content.includes('[CRITICAL]'),
      );
      expect(examPointCallout).toBeDefined();

      // 8. Worked Examples
      const exampleHeading = blocks.find(
        (b) => b.type === 'heading_3' && b.heading_3.rich_text[0].text.content.includes('Problem Example 1:'),
      );
      expect(exampleHeading).toBeDefined();

      const numberedItems = blocks.filter((b) => b.type === 'numbered_list_item');
      expect(numberedItems.length).toBe(3);

      // 9. Rapid Revision Checklist
      const todoItems = blocks.filter((b) => b.type === 'to_do');
      expect(todoItems.length).toBe(2);
      expect(todoItems[0].to_do.checked).toBe(false);

      // 10. Homework & Conclusion
      const homeworkHeading = blocks.find(
        (b) => b.type === 'heading_3' && b.heading_3.rich_text[0].text.content.includes('Homework'),
      );
      expect(homeworkHeading).toBeDefined();
    });
  });

  describe('2000-Character String Chunking', () => {
    it('should split strings longer than 2000 chars into multiple NotionRichTextItems', () => {
      const longText = 'A'.repeat(4500);
      const chunks = service.chunkText(longText);

      expect(chunks.length).toBe(3);
      expect(chunks[0].text.content.length).toBe(2000);
      expect(chunks[1].text.content.length).toBe(2000);
      expect(chunks[2].text.content.length).toBe(500);

      for (const chunk of chunks) {
        expect(chunk.text.content.length).toBeLessThanOrEqual(2000);
      }
    });

    it('should not chunk strings that are under 2000 characters', () => {
      const shortText = 'Standard length explanation';
      const chunks = service.chunkText(shortText);

      expect(chunks.length).toBe(1);
      expect(chunks[0].text.content).toBe(shortText);
    });
  });
});
