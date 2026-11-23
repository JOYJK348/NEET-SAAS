import { Injectable } from '@nestjs/common';
import { RecordedClassStudyNotes } from '../../live/types/recorded-class-ai.types';
import { NotionBlock, NotionRichTextItem } from './notion.types';

@Injectable()
export class NotionBlockBuilderService {
  /**
   * Transforms validated RecordedClassStudyNotes and optional curriculum context
   * into a clean, complete hierarchy of Notion blocks conforming to API 2022-06-28.
   */
  buildStudyNotesBlocks(
    notes: RecordedClassStudyNotes,
    meta?: {
      recordingId?: string;
      version?: number;
      curriculum?: { subject?: string; chapter?: string; topic?: string };
    },
  ): NotionBlock[] {
    const blocks: NotionBlock[] = [];

    // ── 1. Top Callout Banner (Lecture Context & Metadata) ──────────────
    const subject = notes.metadata?.subjectName || meta?.curriculum?.subject || 'NEET Medical';
    const chapter = notes.metadata?.chapterName || meta?.curriculum?.chapter || 'Class Lecture';
    const topic = notes.metadata?.topicName || meta?.curriculum?.topic || notes.lecture?.title || 'Notes';
    const faculty = notes.metadata?.tutorName || 'NEET Academy Faculty';
    const duration = notes.lecture?.durationSeconds
      ? `${Math.round(notes.lecture.durationSeconds / 60)} mins`
      : 'Full Lecture';
    const language = notes.lecture?.language || 'English';
    const versionStr = meta?.version ? ` · Version ${meta.version}` : '';

    blocks.push(
      this.callout(
        [
          this.text('🩺 NEET-UG HIGH YIELD LECTURE NOTES\n', { bold: true }),
          this.text(`📚 Subject: ${subject}  |  📖 Chapter: ${chapter}\n`),
          this.text(`🎯 Topic: ${topic}  |  👨‍🏫 Faculty: ${faculty}\n`),
          this.text(`⏱️ Duration: ${duration}  |  🌐 Language: ${language}${versionStr}`),
        ],
        '🩺',
        'blue_background',
      ),
    );

    // ── 2. Table of Contents ───────────────────────────────────────────
    blocks.push(this.tableOfContents());
    blocks.push(this.divider());

    // ── 3. Executive Synopsis ──────────────────────────────────────────
    if (notes.lecture?.overview) {
      blocks.push(this.heading2('📋 Lecture Synopsis'));
      blocks.push(
        this.callout([this.text(notes.lecture.overview)], '💡', 'gray_background'),
      );
    }

    // ── 4. Learning Objectives ─────────────────────────────────────────
    if (notes.lecture?.learningObjectives && notes.lecture.learningObjectives.length > 0) {
      blocks.push(this.heading2('🎯 Key Learning Objectives'));
      for (const obj of notes.lecture.learningObjectives) {
        blocks.push(this.bulletedItem([this.text(obj)]));
      }
    }

    // ── 5. Timestamped Curriculum Breakdown ────────────────────────────
    if (notes.topics && notes.topics.length > 0) {
      blocks.push(this.divider());
      blocks.push(this.heading2('⏱️ Timestamped Curriculum Breakdown'));

      for (const t of notes.topics) {
        blocks.push(this.heading3(`[${t.timestampLabel || '00:00'}] ${t.title}`));
        if (t.explanation) {
          blocks.push(this.paragraph([this.text(t.explanation)]));
        }
        if (t.subtopics && t.subtopics.length > 0) {
          for (const sub of t.subtopics) {
            blocks.push(this.bulletedItem([this.text(sub)]));
          }
        }
      }
    }

    // ── 6. Important Concepts & Principles ─────────────────────────────
    if (notes.importantConcepts && notes.importantConcepts.length > 0) {
      blocks.push(this.divider());
      blocks.push(this.heading2('🧠 Core Concepts & High-Yield Insights'));

      for (const c of notes.importantConcepts) {
        const categoryTag = c.category ? `[${c.category}] ` : '';
        blocks.push(this.heading3(`💡 ${categoryTag}${c.title}`));
        if (c.explanation) {
          blocks.push(this.paragraph([this.text(c.explanation)]));
        }
        if (c.neetRelevance) {
          blocks.push(
            this.callout(
              [
                this.text('High-Yield Exam Insight: ', { bold: true }),
                this.text(c.neetRelevance),
              ],
              '⭐',
              'yellow_background',
            ),
          );
        }
      }
    }

    // ── 7. Scientific Definitions & Terminology ────────────────────────
    if (notes.definitions && notes.definitions.length > 0) {
      blocks.push(this.divider());
      blocks.push(this.heading2('📖 Scientific Definitions & Key Terminology'));

      for (const d of notes.definitions) {
        const quoteTexts: NotionRichTextItem[] = [
          this.text(`${d.term}: `, { bold: true }),
          this.text(d.definition),
        ];
        if (d.explanation) {
          quoteTexts.push(this.text(`\n💡 Explanation: ${d.explanation}`, { italic: true }));
        }
        blocks.push(this.quote(quoteTexts));
      }
    }

    // ── 8. Formula & Equation Cheat Sheet ──────────────────────────────
    if (notes.formulaCheatSheet && notes.formulaCheatSheet.length > 0) {
      blocks.push(this.divider());
      blocks.push(this.heading2('📐 High-Yield Formula Cheat Sheet'));

      for (const f of notes.formulaCheatSheet) {
        blocks.push(this.heading3(`⚡ ${f.name}`));
        blocks.push(this.code(f.expression, 'plain text'));

        const annotations: NotionRichTextItem[] = [];
        if (f.variableExplanations) {
          annotations.push(
            this.text(`Variables: `, { bold: true }),
            this.text(`${f.variableExplanations}  `),
          );
        }
        if (f.siUnits) {
          annotations.push(
            this.text(`[SI Units: ${f.siUnits}]`, { code: true }),
          );
        }
        if (annotations.length > 0) {
          blocks.push(this.paragraph(annotations));
        }
      }
    }

    // ── 9. High-Yield Exam Points ─────────────────────────────────────
    if (notes.neetExamPoints && notes.neetExamPoints.length > 0) {
      blocks.push(this.divider());
      blocks.push(this.heading2('🎯 High-Yield NEET Exam Points'));

      for (const p of notes.neetExamPoints) {
        const relevanceEmoji = p.relevance === 'CRITICAL' ? '🚨' : '🎯';
        blocks.push(
          this.callout(
            [
              this.text(`[${p.relevance || 'HIGH'}] `, { bold: true }),
              this.text(`${p.point}\n`),
              this.text('MCQ Angle: ', { bold: true, italic: true }),
              this.text(p.potentialQuestionAngle || 'Direct fact-based question'),
            ],
            relevanceEmoji,
            p.relevance === 'CRITICAL' ? 'orange_background' : 'yellow_background',
          ),
        );
      }
    }

    // ── 10. Worked Examples ────────────────────────────────────────────
    if (notes.workedExamples && notes.workedExamples.length > 0) {
      blocks.push(this.divider());
      blocks.push(this.heading2('🧪 Worked Examples & Problem Solving'));

      for (let i = 0; i < notes.workedExamples.length; i++) {
        const ex = notes.workedExamples[i];
        blocks.push(this.heading3(`Problem Example ${i + 1}: ${ex.problem}`));

        if (ex.stepByStepExplanation && ex.stepByStepExplanation.length > 0) {
          for (let sIdx = 0; sIdx < ex.stepByStepExplanation.length; sIdx++) {
            blocks.push(
              this.numberedItem([this.text(ex.stepByStepExplanation[sIdx])]),
            );
          }
        }

        if (ex.finalResult) {
          blocks.push(
            this.callout(
              [
                this.text('Final Result: ', { bold: true }),
                this.text(ex.finalResult, { code: true }),
              ],
              '✅',
              'green_background',
            ),
          );
        }
      }
    }

    // ── 11. Rapid Revision Checklist ───────────────────────────────────
    if (notes.lectureConclusion?.revisionChecklist && notes.lectureConclusion.revisionChecklist.length > 0) {
      blocks.push(this.divider());
      blocks.push(this.heading2('✅ Rapid Revision Checklist'));

      for (const item of notes.lectureConclusion.revisionChecklist) {
        blocks.push(this.toDo([this.text(item)], false));
      }
    }

    // ── 12. Lecture Conclusion & Homework ──────────────────────────────
    if (notes.lectureConclusion?.summary) {
      blocks.push(
        this.callout(
          [
            this.text('Summary: ', { bold: true }),
            this.text(notes.lectureConclusion.summary),
          ],
          '📝',
          'blue_background',
        ),
      );
    }

    if (notes.lectureConclusion?.homework && notes.lectureConclusion.homework.length > 0) {
      blocks.push(this.heading3('📚 Recommended Practice & Homework'));
      for (const hw of notes.lectureConclusion.homework) {
        blocks.push(this.bulletedItem([this.text(hw)]));
      }
    }

    return blocks;
  }

  // ─── Notion Rich Text Builder with 2000-Char Chunking ──────────────

  /**
   * Safely builds rich text items. If a single string exceeds 2000 chars,
   * it splits into multiple sequential chunks so Notion's API does not reject it.
   */
  text(content: string, annotations?: NotionRichTextItem['annotations']): NotionRichTextItem {
    const safeContent = (content || '').substring(0, 2000);
    return {
      type: 'text',
      text: { content: safeContent },
      annotations: annotations || {},
    };
  }

  /**
   * Splits arbitrary string into multiple NotionRichTextItems if > 2000 chars.
   */
  chunkText(content: string, annotations?: NotionRichTextItem['annotations']): NotionRichTextItem[] {
    if (!content) return [];
    if (content.length <= 2000) {
      return [this.text(content, annotations)];
    }

    const items: NotionRichTextItem[] = [];
    let start = 0;
    while (start < content.length) {
      const slice = content.substring(start, start + 2000);
      items.push({
        type: 'text',
        text: { content: slice },
        annotations: annotations || {},
      });
      start += 2000;
    }
    return items;
  }

  // ─── Block Primitive Creators ──────────────────────────────────────

  heading1(title: string): NotionBlock {
    return {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: this.chunkText(title),
      },
    };
  }

  heading2(title: string): NotionBlock {
    return {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: this.chunkText(title),
      },
    };
  }

  heading3(title: string): NotionBlock {
    return {
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: this.chunkText(title),
      },
    };
  }

  paragraph(richText: NotionRichTextItem[]): NotionBlock {
    return {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: richText,
      },
    };
  }

  bulletedItem(richText: NotionRichTextItem[]): NotionBlock {
    return {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: richText,
      },
    };
  }

  numberedItem(richText: NotionRichTextItem[]): NotionBlock {
    return {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: richText,
      },
    };
  }

  toDo(richText: NotionRichTextItem[], checked = false): NotionBlock {
    return {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: richText,
        checked,
      },
    };
  }

  quote(richText: NotionRichTextItem[]): NotionBlock {
    return {
      object: 'block',
      type: 'quote',
      quote: {
        rich_text: richText,
      },
    };
  }

  code(codeContent: string, language = 'plain text'): NotionBlock {
    return {
      object: 'block',
      type: 'code',
      code: {
        rich_text: this.chunkText(codeContent),
        language,
      },
    };
  }

  callout(
    richText: NotionRichTextItem[],
    emoji = '💡',
    color = 'default',
  ): NotionBlock {
    return {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: richText,
        icon: { type: 'emoji', emoji },
        color,
      },
    };
  }

  divider(): NotionBlock {
    return {
      object: 'block',
      type: 'divider',
      divider: {},
    };
  }

  tableOfContents(): NotionBlock {
    return {
      object: 'block',
      type: 'table_of_contents',
      table_of_contents: {
        color: 'default',
      },
    };
  }
}
