import { FileCategoryEnum, FileModuleEnum } from '@prisma/client';

export const MAX_FILE_SIZES: Record<FileCategoryEnum, number> = {
  QUESTION_PAPER: 15 * 1024 * 1024, // 15 MB
  ANSWER_SHEET: 25 * 1024 * 1024, // 25 MB
  LIVE_RECORDING: 2 * 1024 * 1024 * 1024, // 2 GB
  PROFILE_PHOTO: 5 * 1024 * 1024, // 5 MB
  DOCUMENT: 25 * 1024 * 1024, // 25 MB
  IMAGE: 5 * 1024 * 1024, // 5 MB
  SPREADSHEET: 50 * 1024 * 1024, // 50 MB
  CERTIFICATE: 10 * 1024 * 1024, // 10 MB
};

export const ALLOWED_MIME_TYPES: Record<FileCategoryEnum, readonly string[]> = {
  QUESTION_PAPER: ['application/pdf'],
  ANSWER_SHEET: ['application/pdf', 'image/jpeg', 'image/png'],
  LIVE_RECORDING: ['video/mp4', 'video/webm'],
  PROFILE_PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
  DOCUMENT: ['application/pdf', 'image/jpeg', 'image/png'],
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  SPREADSHEET: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
  CERTIFICATE: ['application/pdf', 'image/jpeg', 'image/png'],
};

export const DEFAULT_SIGNED_URL_EXPIRY: Record<FileModuleEnum, number> = {
  EXAMS: 300, // 5 mins
  SUBMISSIONS: 900, // 15 mins
  PROFILES: 3600, // 1 hour
  LIVE_RECORDINGS: 900, // 15 mins
  DOCUMENTS: 900, // 15 mins
  ASSIGNMENTS: 900, // 15 mins
  IMPORTS: 300, // 5 mins
  EXPORTS: 300, // 5 mins
};
