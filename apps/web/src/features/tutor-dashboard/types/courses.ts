interface SubjectDto {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  displayName?: string;
  subjectType: string;
  displayOrder: number;
}

interface BatchRefDto {
  id: string;
  name: string;
  status: string;
}

export interface TopicDto {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  description?: string | null;
  learningObjectives?: string | null;
  difficultyLevel: string;
  plannedHours: number;
  plannedSessions: number;
  displayOrder: number;
  topicItemCount: number;
}

export interface ChapterDto {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  description?: string | null;
  plannedHours: number;
  estimatedSessions: number;
  displayOrder: number;
  topics: TopicDto[];
}

export interface CourseSubjectDto {
  id: string;
  displayOrder: number;
  isMandatory: boolean;
  isActive: boolean;
  subject: SubjectDto;
  chapters: ChapterDto[];
}

export interface TutorCourseDto {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string | null;
  courseType: string;
  durationMonths: number;
  isActive: boolean;
  batches: BatchRefDto[];
  subjects: CourseSubjectDto[];
}

export interface TutorCourseListResponseDto {
  courses: TutorCourseDto[];
}
