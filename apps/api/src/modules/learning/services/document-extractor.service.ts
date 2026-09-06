import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';

@Injectable()
export class DocumentExtractorService {
  private readonly logger = new Logger(DocumentExtractorService.name);

  /**
   * Extract raw text from file buffer based on MIME type or filename extension.
   */
  async extractText(fileBuffer: Buffer, fileName: string, mimeType?: string): Promise<string> {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      if (ext === 'docx' || mimeType?.includes('wordprocessingml')) {
        return await this.extractFromDocx(fileBuffer);
      }

      // Default PDF handling
      return await this.extractFromPdf(fileBuffer);
    } catch (err: any) {
      this.logger.error(`Failed to extract text from file ${fileName}: ${err.message}`);
      throw new Error(`Text extraction failed for ${fileName}: ${err.message}`);
    }
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    // 1. Try extracting word/document.xml from DOCX ZIP archive
    try {
      const xmlText = this.extractDocumentXmlFromZip(buffer);
      if (xmlText && xmlText.trim().length > 20) {
        return xmlText;
      }
    } catch (err: any) {
      this.logger.warn(`ZIP extraction for docx failed, falling back: ${err.message}`);
    }

    // 2. Fallback text extraction
    const rawStr = buffer.toString('utf-8');
    const textMatches = rawStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
    const text = textMatches
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join(' ')
      .trim();

    if (!text || text.length < 20) {
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
    }

    return text;
  }

  private extractDocumentXmlFromZip(buffer: Buffer): string {
    let offset = 0;
    while (offset < buffer.length - 30) {
      // Check local file header signature 0x04034b50 ("PK\x03\x04")
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const fileNameLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);

        const fileName = buffer
          .subarray(offset + 30, offset + 30 + fileNameLen)
          .toString('utf-8');

        const dataStart = offset + 30 + fileNameLen + extraLen;

        if (fileName === 'word/document.xml' || fileName.endsWith('document.xml')) {
          const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
          let xmlContent = '';
          if (compressionMethod === 8) {
            xmlContent = zlib.inflateRawSync(compressedData).toString('utf-8');
          } else if (compressionMethod === 0) {
            xmlContent = compressedData.toString('utf-8');
          }

          if (xmlContent) {
            const textWithNewlines = xmlContent
              .replace(/<\/w:p>/gi, '\n')
              .replace(/<w:br[^>]*>/gi, '\n')
              .replace(/<w:tab[^>]*>/gi, '\t')
              .replace(/<[^>]+>/g, '')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'");

            return textWithNewlines;
          }
        }

        offset = dataStart + compressedSize;
      } else {
        offset++;
      }
    }

    return '';
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    const text = buffer.toString('utf-8');

    // Clean unprintable binary artifacts while preserving newline structure
    const cleaned = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/\r\n/g, '\n');

    if (cleaned.length > 50 && (cleaned.includes('A.') || cleaned.includes('1.') || cleaned.includes('Question'))) {
      return cleaned;
    }

    return cleaned;
  }
}
