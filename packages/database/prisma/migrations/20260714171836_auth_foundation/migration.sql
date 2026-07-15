-- CreateEnum
CREATE TYPE "AcademicStatusEnum" AS ENUM ('ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'ALUMNI');

-- CreateEnum
CREATE TYPE "AdjustmentTypeEnum" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "AdmissionStatusEnum" AS ENUM ('ENQUIRY', 'ACTIVE', 'ON_HOLD', 'DROPPED', 'COMPLETED', 'ALUMNI');

-- CreateEnum
CREATE TYPE "AiAuditEventEnum" AS ENUM ('PROVIDER_REGISTERED', 'MODEL_TOGGLED', 'PROMPT_UPDATED', 'CONVERSATION_ARCHIVED', 'REQUEST_LOGGED');

-- CreateEnum
CREATE TYPE "AiRequestStatusEnum" AS ENUM ('SUCCESS', 'FAILED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "AnalyticsAuditEventEnum" AS ENUM ('DASHBOARD_CREATED', 'WIDGET_CONFIGURED', 'REPORT_EXECUTED', 'KPI_REBUILT', 'STUDENT_ANALYTICS_MUTATED');

-- CreateEnum
CREATE TYPE "AnnouncementTypeEnum" AS ENUM ('GENERAL', 'HOLIDAY', 'EXAM_CIRCULAR', 'FEE_CIRCULAR', 'PLACEMENT');

-- CreateEnum
CREATE TYPE "AnswerStatusEnum" AS ENUM ('CORRECT', 'INCORRECT', 'PARTIAL', 'UNATTEMPTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "AttachmentTypeEnum" AS ENUM ('IMAGE', 'DIAGRAM', 'PDF', 'AUDIO', 'VIDEO', 'FORMULA');

-- CreateEnum
CREATE TYPE "AttemptStatusEnum" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'ABANDONED', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "AttendanceModeType" AS ENUM ('CLASSROOM', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "AttendanceSessionStatusEnum" AS ENUM ('DRAFT', 'OPEN', 'PUBLISHED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AttendanceStatusEnum" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AuthEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESHED', 'TOKEN_REPLAY_DETECTED', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'FORCE_PASSWORD_CHANGE', 'MFA_CHALLENGE', 'MFA_SUCCESS', 'MFA_FAILED', 'SESSION_REVOKED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED');

-- CreateEnum
CREATE TYPE "BackgroundJobStatusEnum" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BatchStatusType" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BloodGroupType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "BloomsLevelEnum" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('HEAD_OFFICE', 'CAMPUS', 'FRANCHISE', 'ONLINE');

-- CreateEnum
CREATE TYPE "CampaignStatusEnum" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChatMessageRoleEnum" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ChatMessageTypeEnum" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'LINK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ClockDirectionType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "ClosureStatusEnum" AS ENUM ('OPEN', 'CLOSED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "CommsChannelType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CommunicationAuditEventTypeEnum" AS ENUM ('TEMPLATE_CREATED', 'TEMPLATE_UPDATED', 'VERSION_ARCHIVED', 'CAMPAIGN_LAUNCHED', 'PREFERENCE_UPDATED', 'DEVICE_REGISTERED', 'PROVIDER_TOGGLED', 'FAILOVER_TRIGGERED');

-- CreateEnum
CREATE TYPE "DashboardViewerRoleEnum" AS ENUM ('PRINCIPAL', 'FACULTY', 'STUDENT', 'PARENT', 'FINANCE');

-- CreateEnum
CREATE TYPE "DeliveryStatusEnum" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED', 'SPAM');

-- CreateEnum
CREATE TYPE "DevicePlatformEnum" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateEnum
CREATE TYPE "DiscussionStatusEnum" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DocumentCategoryEnum" AS ENUM ('QUESTION_PAPER', 'ANSWER_KEY', 'OMR_SCAN', 'SOLUTION_PDF', 'ADMIT_CARD', 'HALL_TICKET', 'RESULT_SHEET', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVisibilityType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EmploymentStatusEnum" AS ENUM ('ACTIVE', 'ON_NOTICE', 'RESIGNED', 'TERMINATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EmploymentTypeEnum" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING');

-- CreateEnum
CREATE TYPE "EvaluationStatusEnum" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'RE_EVALUATION');

-- CreateEnum
CREATE TYPE "ExamModeEnum" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ExamPublishStatusEnum" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExamTypeEnum" AS ENUM ('WEEKLY', 'MONTHLY', 'GRAND', 'FULL_SYLLABUS', 'CHAPTER', 'UNIT', 'REVISION', 'PRACTICE', 'SCHOLARSHIP');

-- CreateEnum
CREATE TYPE "FeeAuditEventTypeEnum" AS ENUM ('STRUCTURE_CREATED', 'STRUCTURE_UPDATED', 'FEE_ASSIGNED', 'DISCOUNT_APPLIED', 'INSTALLMENT_OVERRIDDEN', 'PENALTY_ADDED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'REFUND_PROCESSED', 'FEE_WAIVED', 'RECONCILIATION_MATCHED', 'ADJUSTMENT_APPLIED', 'CLOSURE_COMPLETED');

-- CreateEnum
CREATE TYPE "FeeNotificationChannelEnum" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "FeeNotificationStatusEnum" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "FeeStatusEnum" AS ENUM ('PAID', 'UNPAID', 'PARTIAL', 'WAIVED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "FeeStructureStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportStatusEnum" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "InstallmentStatusEnum" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "LearningAttachmentTypeEnum" AS ENUM ('VIDEO', 'PDF', 'DOC', 'PPT', 'ZIP', 'IMAGE', 'SVG', 'AUDIO', 'SUBTITLE', 'THUMBNAIL', 'SLIDE', 'DIAGRAM', 'FORMULA');

-- CreateEnum
CREATE TYPE "LearningMaterialStatusEnum" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LearningMaterialTypeEnum" AS ENUM ('NOTES', 'VIDEO', 'PDF', 'DOC', 'PPT', 'ZIP', 'IMAGE', 'SVG', 'AUDIO', 'REVISION_SHEET', 'MIND_MAP', 'LAB_MANUAL', 'FLASH_CARDS', 'PRESENTATION', 'SLIDE', 'SUBTITLE', 'THUMBNAIL', 'QUIZ', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "LearningPathStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeaveCategoryEnum" AS ENUM ('SICK', 'CASUAL', 'EMERGENCY', 'DUTY', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LiveClassEventTypeEnum" AS ENUM ('HOST_JOINED', 'HOST_LEFT', 'STUDENT_JOINED', 'STUDENT_LEFT', 'RECORDING_STARTED', 'RECORDING_STOPPED', 'POLL_CREATED', 'POLL_CLOSED', 'BREAKOUT_STARTED', 'BREAKOUT_ENDED', 'SCREEN_SHARE_STARTED', 'WHITEBOARD_OPENED', 'CHAT_DISABLED', 'MIC_DISABLED');

-- CreateEnum
CREATE TYPE "LiveClassStatusEnum" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'WAITING', 'LIVE', 'PAUSED', 'ENDED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LiveClassTypeEnum" AS ENUM ('LIVE', 'RECORDED', 'HYBRID', 'DOUBT_SESSION', 'REVISION', 'CRASH_COURSE', 'TEST_DISCUSSION');

-- CreateEnum
CREATE TYPE "MaterialVisibilityEnum" AS ENUM ('PUBLIC', 'COURSE_ONLY', 'BATCH_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MeetingProviderEnum" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'TEAMS', 'LMS_INTERNAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MenuNodeType" AS ENUM ('MODULE', 'GROUP', 'MENU');

-- CreateEnum
CREATE TYPE "NotificationChannelTypeEnum" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "ParentRelationshipTypeEnum" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "ParticipantRoleEnum" AS ENUM ('HOST', 'CO_HOST', 'MODERATOR', 'GUEST', 'OBSERVER');

-- CreateEnum
CREATE TYPE "PaymentMethodEnum" AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_GATEWAY');

-- CreateEnum
CREATE TYPE "PlatformAuditEventEnum" AS ENUM ('SETTING_MUTATED', 'FLAG_TOGGLED', 'API_KEY_ROTATED', 'JOB_SCHEDULED', 'HEALTH_HEALTHY', 'ERROR_LOGGED');

-- CreateEnum
CREATE TYPE "PollStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "PollTypeEnum" AS ENUM ('MCQ', 'MULTI_CORRECT', 'YES_NO');

-- CreateEnum
CREATE TYPE "ProgressStatusEnum" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuestionDifficultyEnum" AS ENUM ('VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "QuestionSourceEnum" AS ENUM ('MANUAL', 'AI_GENERATED', 'IMPORT', 'BULK_UPLOAD', 'OCR', 'SCANNED');

-- CreateEnum
CREATE TYPE "QuestionStatusEnum" AS ENUM ('DRAFT', 'REVIEW_PENDING', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionTypeEnum" AS ENUM ('MCQ', 'MULTI_CORRECT', 'ASSERTION_REASON', 'TRUE_FALSE', 'MATCHING', 'NUMERICAL', 'DESCRIPTIVE');

-- CreateEnum
CREATE TYPE "QueueStatusEnum" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'RETRY_PENDING');

-- CreateEnum
CREATE TYPE "RaiseHandStatusEnum" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReconciliationStatusEnum" AS ENUM ('RECONCILED', 'UNMATCHED', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "RecordingStatusEnum" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RefreshJobStatusEnum" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatusEnum" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RegistrationStatusEnum" AS ENUM ('REGISTERED', 'CONFIRMED', 'CANCELLED', 'ABSENT');

-- CreateEnum
CREATE TYPE "ReportFormatEnum" AS ENUM ('PDF', 'CSV', 'XLSX');

-- CreateEnum
CREATE TYPE "ResourceTypeEnum" AS ENUM ('PDF', 'PPT', 'WORKSHEET', 'IMAGE', 'VIDEO', 'LINK');

-- CreateEnum
CREATE TYPE "ResultStatusEnum" AS ENUM ('PENDING', 'EVALUATING', 'PUBLISHED', 'WITHHELD', 'RE_EVALUATED');

-- CreateEnum
CREATE TYPE "ReviewStatusEnum" AS ENUM ('PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoleAssignmentSource" AS ENUM ('MANUAL', 'SYSTEM', 'MIGRATION', 'API', 'IMPORT');

-- CreateEnum
CREATE TYPE "SessionEndReasonEnum" AS ENUM ('COMPLETED', 'HOST_LEFT', 'CRASHED', 'TIMEOUT', 'FORCE_CLOSED');

-- CreateEnum
CREATE TYPE "SessionStatusEnum" AS ENUM ('CREATED', 'WAITING', 'STARTED', 'PAUSED', 'RESUMED', 'ENDED', 'FAILED');

-- CreateEnum
CREATE TYPE "SessionStatusType" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'LOGGED_OUT');

-- CreateEnum
CREATE TYPE "SessionTypeEnum" AS ENUM ('BATCH', 'GROUP', 'ONE_TO_ONE');

-- CreateEnum
CREATE TYPE "StorageProviderType" AS ENUM ('LOCAL', 'R2', 'S3');

-- CreateEnum
CREATE TYPE "TagTypeEnum" AS ENUM ('TOPIC', 'CHAPTER', 'DIFFICULTY', 'EXAM_TYPE', 'FREQUENCY', 'SOURCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TransactionStatusEnum" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "UserStatusType" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserTypeEnum" AS ENUM ('STAFF', 'STUDENT', 'PARENT', 'TUTOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WeekdayType" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "WidgetTypeEnum" AS ENUM ('KPI_CARD', 'BAR_CHART', 'LINE_CHART', 'PIE_CHART', 'DATA_TABLE');

-- CreateTable
CREATE TABLE "Institutes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "logoFileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Institutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "branchType" "BranchType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYears" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AcademicYears_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchDepartments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BranchDepartments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Courses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "courseType" TEXT NOT NULL DEFAULT 'REGULAR',
    "durationMonths" INTEGER NOT NULL DEFAULT 12,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subjects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL DEFAULT 'CORE',
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSubjects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "passingMarks" INTEGER NOT NULL DEFAULT 40,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "plannedHours" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CourseSubjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseSubjectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "plannedHours" INTEGER NOT NULL DEFAULT 10,
    "estimatedSessions" INTEGER NOT NULL DEFAULT 8,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learningObjectives" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "plannedHours" INTEGER NOT NULL DEFAULT 4,
    "plannedSessions" INTEGER NOT NULL DEFAULT 3,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchDeliveryTypes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attendanceMode" "AttendanceModeType" NOT NULL,
    "defaultMaxStudents" INTEGER NOT NULL DEFAULT 40,
    "defaultStartTime" TIMESTAMP(3) NOT NULL,
    "defaultEndTime" TIMESTAMP(3) NOT NULL,
    "colorCode" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BatchDeliveryTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "deliveryTypeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "BatchStatusType" NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 40,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allowNewAdmissions" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "userType" "UserTypeEnum" NOT NULL,
    "status" "UserStatusType" NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT NOT NULL,
    "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "roleType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "isDeletable" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "permissionGroupId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDeprecated" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'TENANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3) NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignmentReason" TEXT NOT NULL,
    "revokedBy" TEXT NOT NULL,
    "revokedReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menus" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL,
    "menuType" "MenuNodeType" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "showInSidebar" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featureFlag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPermissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "MenuPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformSessionId" TEXT NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browserName" TEXT NOT NULL,
    "osName" TEXT NOT NULL,
    "rawUserAgent" TEXT NOT NULL,
    "status" "SessionStatusType" NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "loggedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthEvents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eventType" "AuthEventType" NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "rawUserAgent" TEXT NOT NULL,
    "locationCountry" TEXT NOT NULL,
    "locationRegion" TEXT NOT NULL,
    "locationTimezone" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetTokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfiles" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "employmentType" "EmploymentTypeEnum" NOT NULL,
    "employmentStatus" "EmploymentStatusEnum" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "resignedAt" TIMESTAMP(3) NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "workPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StaffProfiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "StudentProfiles" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "GenderType" NOT NULL,
    "bloodGroup" "BloodGroupType" NOT NULL,
    "academicStatus" "AcademicStatusEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "profileVersion" INTEGER NOT NULL DEFAULT 1,
    "lastProfileUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileCompletionPercentage" DECIMAL(65,30) NOT NULL DEFAULT 0.00,

    CONSTRAINT "StudentProfiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ParentProfiles" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ParentProfiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "StudentParents" (
    "studentProfileId" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "relationshipType" "ParentRelationshipTypeEnum" NOT NULL,
    "isPrimaryGuardian" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "StudentParents_pkey" PRIMARY KEY ("studentProfileId","parentProfileId")
);

-- CreateTable
CREATE TABLE "StudentAdmissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admissionStatus" "AdmissionStatusEnum" NOT NULL,
    "remarks" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentAdmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentBatchEnrollments" (
    "id" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3) NOT NULL,
    "status" "BatchStatusType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentBatchEnrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDepartments" (
    "staffProfileId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StaffDepartments_pkey" PRIMARY KEY ("staffProfileId","branchId","departmentId")
);

-- CreateTable
CREATE TABLE "StaffSubjects" (
    "staffProfileId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StaffSubjects_pkey" PRIMARY KEY ("staffProfileId","subjectId")
);

-- CreateTable
CREATE TABLE "StudentDocuments" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentDocuments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffBatchAssignments" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StaffBatchAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentMedicalProfiles" (
    "studentProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "allergies" TEXT NOT NULL,
    "medicalConditions" TEXT NOT NULL,
    "emergencyNotes" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentMedicalProfiles_pkey" PRIMARY KEY ("studentProfileId")
);

-- CreateTable
CREATE TABLE "StaffQualifications" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "yearCompleted" INTEGER NOT NULL,
    "experienceMonths" INTEGER NOT NULL DEFAULT 0,
    "certificatesMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StaffQualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContacts" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EmergencyContacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffEmploymentHistory" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatusEnum" NOT NULL,
    "eventReason" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "StaffEmploymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentStatusHistory" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonIdentifiers" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PersonIdentifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "sessionStatus" "AttendanceSessionStatusEnum" NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AttendanceSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecords" (
    "id" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "attendanceStatus" "AttendanceStatusEnum" NOT NULL,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AttendanceRecords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterType" "UserTypeEnum" NOT NULL,
    "leaveCategory" "LeaveCategoryEnum" NOT NULL,
    "leaveStatus" "LeaveStatusEnum" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "rejectionReason" TEXT NOT NULL,
    "cancelledBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LeaveRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceAdjustments" (
    "id" TEXT NOT NULL,
    "attendanceRecordId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "oldStatus" "AttendanceStatusEnum" NOT NULL,
    "newStatus" "AttendanceStatusEnum" NOT NULL,
    "reason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "AttendanceAdjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveAttachments" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LeaveAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exams" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "questionPaperId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "examType" "ExamTypeEnum" NOT NULL,
    "mode" "ExamModeEnum" NOT NULL,
    "totalMarks" DECIMAL(65,30) NOT NULL,
    "passingMarks" DECIMAL(65,30) NOT NULL,
    "negativeMarkingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "negativeMarkingValue" DECIMAL(65,30) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 180,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "publishStatus" "ExamPublishStatusEnum" NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "publishedFromIp" TEXT NOT NULL,
    "publishedDevice" TEXT NOT NULL,
    "resultsPublishedAt" TIMESTAMP(3) NOT NULL,
    "resultsPublishedBy" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "calculatorAllowed" BOOLEAN NOT NULL DEFAULT false,
    "roughSheetAllowed" BOOLEAN NOT NULL DEFAULT true,
    "omrTemplateId" TEXT NOT NULL,
    "omrSheetCount" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedVersion" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "status" "ExamStatusEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,

    CONSTRAINT "Exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "totalMarks" DECIMAL(65,30) NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "marksPerQuestion" DECIMAL(65,30) NOT NULL,
    "negativeMarksPerQuestion" DECIMAL(65,30) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ExamSections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "questionBankId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "marks" DECIMAL(65,30) NOT NULL,
    "negativeMarks" DECIMAL(65,30) NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'MCQ',
    "difficulty" "QuestionDifficultyEnum" NOT NULL,
    "topicTag" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ExamQuestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPapers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paperCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "totalMarks" DECIMAL(65,30) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedVersion" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "QuestionPapers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPaperQuestions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "marks" DECIMAL(65,30) NOT NULL,
    "negativeMarks" DECIMAL(65,30) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionPaperQuestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRegistrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "hallTicketNumber" TEXT NOT NULL,
    "registrationStatus" "RegistrationStatusEnum" NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "eligibilityRemarks" TEXT NOT NULL,
    "feeStatus" "FeeStatusEnum" NOT NULL,
    "admitCardIssued" BOOLEAN NOT NULL DEFAULT false,
    "admitCardIssuedAt" TIMESTAMP(3) NOT NULL,
    "admitCardDownloadedAt" TIMESTAMP(3) NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seatNumber" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ExamRegistrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "autoSubmittedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "status" "AttemptStatusEnum" NOT NULL,
    "submittedBySystem" BOOLEAN NOT NULL DEFAULT false,
    "deviceType" TEXT NOT NULL,
    "browserName" TEXT NOT NULL,
    "browserVersion" TEXT NOT NULL,
    "osName" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "deviceMetadata" JSONB NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timeTakenSeconds" INTEGER NOT NULL,
    "timePausedSeconds" INTEGER NOT NULL DEFAULT 0,
    "proctoringSessionId" TEXT NOT NULL,
    "proctoringStatus" TEXT NOT NULL,
    "omrSheetId" TEXT NOT NULL,
    "answerSheetReceived" BOOLEAN NOT NULL DEFAULT false,
    "answerSheetReceivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ExamAttempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnswers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "marksAwarded" DECIMAL(65,30) NOT NULL,
    "answerStatus" "AnswerStatusEnum" NOT NULL,
    "evaluationStatus" "EvaluationStatusEnum" NOT NULL,
    "evaluatedBy" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ExamAnswers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResults" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "resultStatus" "ResultStatusEnum" NOT NULL,
    "totalMarks" DECIMAL(65,30) NOT NULL,
    "obtainedMarks" DECIMAL(65,30) NOT NULL,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "wrong" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "percentage" DECIMAL(65,30) NOT NULL,
    "percentile" DECIMAL(65,30) NOT NULL,
    "rank" INTEGER NOT NULL,
    "passingMarks" DECIMAL(65,30) NOT NULL,
    "passFail" BOOLEAN NOT NULL,
    "grade" TEXT NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "reEvaluationRequested" BOOLEAN NOT NULL DEFAULT false,
    "reEvaluatedAt" TIMESTAMP(3) NOT NULL,
    "reEvaluatedBy" TEXT NOT NULL,
    "aiEvaluationMetadata" JSONB NOT NULL,
    "resultHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ExamResults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResultHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentEnrollmentId" TEXT NOT NULL,
    "oldTotalMarks" DECIMAL(65,30) NOT NULL,
    "oldObtainedMarks" DECIMAL(65,30) NOT NULL,
    "newTotalMarks" DECIMAL(65,30) NOT NULL,
    "newObtainedMarks" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultSnapshot" JSONB NOT NULL,

    CONSTRAINT "ExamResultHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamDocuments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "documentCategory" "DocumentCategoryEnum" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ExamDocuments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionTypeEnum" NOT NULL,
    "difficulty" "QuestionDifficultyEnum" NOT NULL,
    "bloomsLevel" "BloomsLevelEnum" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'EN',
    "source" "QuestionSourceEnum" NOT NULL,
    "questionStatus" "QuestionStatusEnum" NOT NULL,
    "publishedVersion" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "aiMetadata" JSONB NOT NULL,
    "embeddingMetadata" JSONB NOT NULL,
    "difficultyPrediction" JSONB NOT NULL,
    "taxonomyMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionOrder" INTEGER NOT NULL DEFAULT 1,
    "optionLabel" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionExplanations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'EN',
    "solutionText" TEXT NOT NULL,
    "shortExplanation" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionExplanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTags" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    "tagType" "TagTypeEnum" NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionTags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTagMappings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionTagMappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionVersions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "QuestionVersions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAttachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "attachmentType" "AttachmentTypeEnum" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "caption" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionReviews" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewStatus" "ReviewStatusEnum" NOT NULL,
    "comments" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionReviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionUsage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "examCount" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "correctPercentage" DECIMAL(65,30) NOT NULL,
    "wrongPercentage" DECIMAL(65,30) NOT NULL,
    "skippedPercentage" DECIMAL(65,30) NOT NULL,
    "avgTimeSeconds" DECIMAL(65,30) NOT NULL,
    "maxTimeSeconds" DECIMAL(65,30) NOT NULL,
    "minTimeSeconds" DECIMAL(65,30) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "difficultyTrend" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionImportJobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "defaultDifficulty" "QuestionDifficultyEnum" NOT NULL,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'EN',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatusEnum" NOT NULL,
    "errorLog" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionImportJobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMaterials" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "materialType" "LearningMaterialTypeEnum" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'EN',
    "difficulty" "QuestionDifficultyEnum" NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "readingTime" INTEGER NOT NULL,
    "status" "LearningMaterialStatusEnum" NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "visibility" "MaterialVisibilityEnum" NOT NULL,
    "embeddingId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keywords" TEXT[],
    "aiMetadata" JSONB NOT NULL,
    "searchVector" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LearningMaterials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialVersions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "materialSnapshot" JSONB NOT NULL,
    "changeReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "MaterialVersions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialAttachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "attachmentType" "LearningAttachmentTypeEnum" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "duration" INTEGER NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MaterialAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPaths" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "QuestionDifficultyEnum" NOT NULL,
    "estimatedDays" INTEGER NOT NULL,
    "status" "LearningPathStatusEnum" NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LearningPaths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathMaterials" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "unlockAfterDays" INTEGER NOT NULL DEFAULT 0,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LearningPathMaterials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLearningProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "progressPercentage" DECIMAL(65,30) NOT NULL,
    "lastPosition" INTEGER NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" "ProgressStatusEnum" NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentLearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningBookmarks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "videoTimestamp" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LearningBookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningNotes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "highlight" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "videoTimestamp" INTEGER NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LearningNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDiscussions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "parentCommentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "DiscussionStatusEnum" NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MaterialDiscussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialAssignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "questionBankId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "marks" DECIMAL(65,30) NOT NULL,
    "submissionType" TEXT NOT NULL DEFAULT 'TEXT',
    "instructions" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MaterialAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSubmissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "marks" DECIMAL(65,30) NOT NULL,
    "feedback" TEXT NOT NULL,
    "evaluatedBy" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "submittedByAi" BOOLEAN NOT NULL DEFAULT false,
    "lateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "storageObjectId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AssignmentSubmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClasses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionPaperId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learningObjectives" TEXT[],
    "prerequisites" TEXT[],
    "teacherNotes" TEXT NOT NULL,
    "classType" "LiveClassTypeEnum" NOT NULL,
    "sessionType" "SessionTypeEnum" NOT NULL,
    "meetingProvider" "MeetingProviderEnum" NOT NULL,
    "meetingCode" TEXT NOT NULL,
    "meetingPassword" TEXT NOT NULL,
    "waitingRoomEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lobbyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "screenShareEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whiteboardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "breakoutRoomEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3) NOT NULL,
    "actualEnd" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "maximumStudents" INTEGER NOT NULL DEFAULT 500,
    "minimumStudents" INTEGER NOT NULL DEFAULT 1,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT false,
    "waitlistCount" INTEGER NOT NULL DEFAULT 0,
    "status" "LiveClassStatusEnum" NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "publishedBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "cancelledBy" TEXT NOT NULL,
    "cancelReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClasses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassInstructors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "role" "ParticipantRoleEnum" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassInstructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassSessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "providerSessionId" TEXT NOT NULL,
    "providerMetadata" JSONB NOT NULL,
    "status" "SessionStatusEnum" NOT NULL,
    "endedReason" "SessionEndReasonEnum" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "hostJoinedAt" TIMESTAMP(3) NOT NULL,
    "hostLeftAt" TIMESTAMP(3) NOT NULL,
    "peakParticipants" INTEGER NOT NULL DEFAULT 0,
    "networkQualityScore" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassParticipants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "networkType" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3) NOT NULL,
    "cameraEnabled" BOOLEAN NOT NULL DEFAULT false,
    "micEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassAttendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "attendanceStatus" "AttendanceStatusEnum" NOT NULL,
    "totalDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyLeaveMinutes" INTEGER NOT NULL DEFAULT 0,
    "networkDisconnectCount" INTEGER NOT NULL DEFAULT 0,
    "cameraOnPercentage" DECIMAL(65,30) NOT NULL,
    "micOnPercentage" DECIMAL(65,30) NOT NULL,
    "attentionScore" DECIMAL(65,30) NOT NULL,
    "focusScore" DECIMAL(65,30) NOT NULL,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassRecordings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "thumbnailObjectId" TEXT NOT NULL,
    "transcriptObjectId" TEXT NOT NULL,
    "subtitleObjectId" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "resolution" TEXT NOT NULL,
    "bitrateKbps" INTEGER NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "status" "RecordingStatusEnum" NOT NULL,
    "processingStartedAt" TIMESTAMP(3) NOT NULL,
    "processingCompletedAt" TIMESTAMP(3) NOT NULL,
    "transcriptCompletedAt" TIMESTAMP(3) NOT NULL,
    "aiSummaryCompletedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassRecordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassResources" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "resourceType" "ResourceTypeEnum" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isDownloadable" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3) NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassResources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassChatMessages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "replyToMessageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "ParticipantRoleEnum" NOT NULL,
    "messageType" "ChatMessageTypeEnum" NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "reactionCount" JSONB NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassChatMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassPolls" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "pollType" "PollTypeEnum" NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "timeLimitSeconds" INTEGER NOT NULL,
    "showResultsLive" BOOLEAN NOT NULL DEFAULT true,
    "publishResultAfterClose" BOOLEAN NOT NULL DEFAULT true,
    "status" "PollStatusEnum" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassPolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassPollResponses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "timeTakenSeconds" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassPollResponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassWhiteboardSnapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "drawingVersion" INTEGER NOT NULL DEFAULT 1,
    "ocrStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ocrText" TEXT NOT NULL,
    "embeddingId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassWhiteboardSnapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassRaiseHands" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "status" "RaiseHandStatusEnum" NOT NULL,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3) NOT NULL,
    "respondedBy" TEXT NOT NULL,
    "responseDurationSeconds" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassRaiseHands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassBreakoutRooms" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "providerRoomId" TEXT NOT NULL,
    "topicFocus" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 20,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassBreakoutRooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakoutRoomParticipants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "breakoutRoomId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BreakoutRoomParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassEvents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" "LiveClassEventTypeEnum" NOT NULL,
    "eventPayload" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LiveClassEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructures" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3) NOT NULL,
    "status" "FeeStructureStatusEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeStructures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructureItems" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "taxPercentage" DECIMAL(65,30) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "refundable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeStructureItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeAssignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "adjustmentAmount" DECIMAL(65,30) NOT NULL,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentFeeAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeInstallments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "offsetDays" INTEGER NOT NULL DEFAULT 0,
    "amountPercentage" DECIMAL(65,30) NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "lateFeeRuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeInstallments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeInstallments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentFeeAssignmentId" TEXT NOT NULL,
    "feeInstallmentId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "penaltyAmount" DECIMAL(65,30) NOT NULL,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL,
    "balanceAmount" DECIMAL(65,30) NOT NULL,
    "status" "InstallmentStatusEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentFeeInstallments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentFeeInstallmentId" TEXT NOT NULL,
    "collectionCenterId" TEXT NOT NULL,
    "closureId" TEXT NOT NULL,
    "financialPeriodId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentMethod" "PaymentMethodEnum" NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeePayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "gatewayName" TEXT NOT NULL,
    "gatewayTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "TransactionStatusEnum" NOT NULL,
    "failureReason" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "gatewayResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PaymentTransactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRefunds" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "refundAmount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatusEnum" NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "refundedAt" TIMESTAMP(3) NOT NULL,
    "gatewayRefundId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PaymentRefunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeDiscounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountPercentage" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "maxDiscountLimit" DECIMAL(65,30) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeDiscounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeDiscounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentFeeAssignmentId" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentFeeDiscounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePenalties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "flatAmount" DECIMAL(65,30) NOT NULL,
    "amountPerDay" DECIMAL(65,30) NOT NULL,
    "maxPenaltyLimit" DECIMAL(65,30) NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeePenalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeePenalties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentFeeInstallmentId" TEXT NOT NULL,
    "penaltyId" TEXT NOT NULL,
    "lateDays" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(65,30) NOT NULL,
    "isWaived" BOOLEAN NOT NULL DEFAULT false,
    "waivedBy" TEXT NOT NULL,
    "waivedAt" TIMESTAMP(3) NOT NULL,
    "waiveReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentFeePenalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeReceipts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeReceipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarships" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "scholarshipPercentage" DECIMAL(65,30) NOT NULL,
    "scholarshipAmount" DECIMAL(65,30) NOT NULL,
    "maxAmountLimit" DECIMAL(65,30) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeWaivers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentFeeInstallmentId" TEXT NOT NULL,
    "waiverAmount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeWaivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "reconciledDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReconciliationStatusEnum" NOT NULL,
    "bankStatementRef" TEXT NOT NULL,
    "expectedAmount" DECIMAL(65,30) NOT NULL,
    "actualAmount" DECIMAL(65,30) NOT NULL,
    "discrepancyAmount" DECIMAL(65,30) NOT NULL,
    "reconciledBy" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeNotifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentFeeInstallmentId" TEXT NOT NULL,
    "notificationChannel" "FeeNotificationChannelEnum" NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FeeNotificationStatusEnum" NOT NULL,
    "failureReason" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeNotifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAuditLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "eventType" "FeeAuditEventTypeEnum" NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeAuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAdjustments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentFeeAssignmentId" TEXT NOT NULL,
    "adjustmentType" "AdjustmentTypeEnum" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustedBy" TEXT NOT NULL,
    "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeAdjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "studentFeeInstallmentId" TEXT NOT NULL,
    "feeStructureItemId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PaymentAllocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeCollectionClosures" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "status" "ClosureStatusEnum" NOT NULL,
    "openingBalance" DECIMAL(65,30) NOT NULL,
    "expectedAmount" DECIMAL(65,30) NOT NULL,
    "actualAmount" DECIMAL(65,30) NOT NULL,
    "discrepancyAmount" DECIMAL(65,30) NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeCollectionClosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeCollectionCenters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FeeCollectionCenters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialPeriodsMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FinancialPeriodsMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultChannel" "NotificationChannelTypeEnum" NOT NULL,
    "fallbackChannel" "NotificationChannelTypeEnum" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplateVersions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationTemplateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationTemplateVersions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationCampaigns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationTemplateId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CampaignStatusEnum" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationCampaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationCampaignTargets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationCampaignId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientVariables" JSONB NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationCampaignTargets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationTemplateId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "notificationCampaignId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channelType" "NotificationChannelTypeEnum" NOT NULL,
    "status" "QueueStatusEnum" NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledSendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDeliveries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationQueueId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "status" "DeliveryStatusEnum" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL,
    "deliveryLatencyMs" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(65,30) NOT NULL,
    "providerResponse" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationDeliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationChannels" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supportsAttachments" BOOLEAN NOT NULL DEFAULT false,
    "supportsTemplates" BOOLEAN NOT NULL DEFAULT true,
    "maxBodySize" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "NotificationChannels_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelType" "NotificationChannelTypeEnum" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSubscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationSubscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationQueueId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "channelType" "NotificationChannelTypeEnum" NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsProviders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "providerConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "balanceCredits" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SmsProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailProviders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "providerConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EmailProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappProviders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "providerConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "WhatsappProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushDevices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "platform" "DevicePlatformEnum" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PushDevices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pushDeviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clickAction" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PushNotifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "announcementType" "AnnouncementTypeEnum" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdByUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementReads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AnnouncementReads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "WebhookEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDeliveries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "webhookEventId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "errorLog" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "WebhookDeliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAuditLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" "CommunicationAuditEventTypeEnum" NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CommunicationAuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAttachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationQueueId" TEXT NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationVariables" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationVariables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRetryQueue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "notificationQueueId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT NOT NULL,
    "backoffMultiplier" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationRetryQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationRateLimits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "limitScope" TEXT NOT NULL,
    "scopeTargetCode" TEXT NOT NULL,
    "maxMessagesAllowed" INTEGER NOT NULL,
    "windowSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CommunicationRateLimits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderFailovers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channelType" "NotificationChannelTypeEnum" NOT NULL,
    "primaryProviderId" TEXT NOT NULL,
    "fallbackProviderId" TEXT NOT NULL,
    "consecutiveFailuresThreshold" INTEGER NOT NULL DEFAULT 5,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProviderFailovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardDefinitions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetRole" "DashboardViewerRoleEnum" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "gridLayout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DashboardDefinitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidgets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dashboardDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widgetType" "WidgetTypeEnum" NOT NULL,
    "rowIndex" INTEGER NOT NULL DEFAULT 0,
    "colIndex" INTEGER NOT NULL DEFAULT 0,
    "sizeWidth" INTEGER NOT NULL DEFAULT 4,
    "sizeHeight" INTEGER NOT NULL DEFAULT 2,
    "dataSourceQuery" TEXT NOT NULL,
    "displayConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DashboardWidgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDefinitions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "queryDefinition" TEXT NOT NULL,
    "supportedFormats" TEXT NOT NULL DEFAULT '''{PDF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReportDefinitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExecutions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "executionParams" JSONB NOT NULL,
    "formatType" "ReportFormatEnum" NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReportExecutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiDefinitions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "formulaExpression" TEXT NOT NULL,
    "refreshFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "KpiDefinitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kpiDefinitionId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "metricValue" DECIMAL(65,30) NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "KpiSnapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnalytics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentAdmissionId" TEXT NOT NULL,
    "totalAttendanceSessions" INTEGER NOT NULL DEFAULT 0,
    "presentSessionsCount" INTEGER NOT NULL DEFAULT 0,
    "attendanceRatio" DECIMAL(65,30) NOT NULL,
    "examsTakenCount" INTEGER NOT NULL DEFAULT 0,
    "averageTestScore" DECIMAL(65,30) NOT NULL,
    "highestScore" DECIMAL(65,30) NOT NULL,
    "rankInBatch" INTEGER NOT NULL,
    "totalAssignedFees" DECIMAL(65,30) NOT NULL,
    "totalPaidFees" DECIMAL(65,30) NOT NULL,
    "totalOutstandingBalance" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StudentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchAnalytics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "activeStudentsCount" INTEGER NOT NULL DEFAULT 0,
    "averageTestScore" DECIMAL(65,30) NOT NULL,
    "averageAttendanceRatio" DECIMAL(65,30) NOT NULL,
    "totalRevenue" DECIMAL(65,30) NOT NULL,
    "totalOutstanding" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BranchAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAnalytics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "totalInvoicedAmount" DECIMAL(65,30) NOT NULL,
    "totalReceivedAmount" DECIMAL(65,30) NOT NULL,
    "totalOutstandingAmount" DECIMAL(65,30) NOT NULL,
    "totalRefundedAmount" DECIMAL(65,30) NOT NULL,
    "totalWaivedAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FinancialAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsRefreshJobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "status" "RefreshJobStatusEnum" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "executionDurationMs" INTEGER NOT NULL,
    "errorLog" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AnalyticsRefreshJobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsAuditLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" "AnalyticsAuditEventEnum" NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AnalyticsAuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "providerConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "maxRequestsPerMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModels" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiProviderId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contextWindowTokens" INTEGER NOT NULL DEFAULT 8192,
    "inputTokenPriceUsd" DECIMAL(65,30) NOT NULL,
    "outputTokenPriceUsd" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiModels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPrompts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userTemplate" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiPrompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Conversation with AI Tutor',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiConversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiConversationId" TEXT NOT NULL,
    "role" "ChatMessageRoleEnum" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensConsumed" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "aiGeneratedContentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiModelId" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL,
    "executionDurationMs" INTEGER NOT NULL,
    "estimatedCostUsd" DECIMAL(65,30) NOT NULL,
    "status" "AiRequestStatusEnum" NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "triggeredByUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneratedContent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "referenceEntityType" TEXT NOT NULL,
    "referenceEntityId" TEXT NOT NULL,
    "generatedOutput" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiGeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFeedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "aiMessageId" TEXT NOT NULL,
    "ratingScore" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokensConsumed" INTEGER NOT NULL DEFAULT 0,
    "requestsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiUsageLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAuditLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" "AiAuditEventEnum" NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiAuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "locale" TEXT NOT NULL DEFAULT 'en-IN',
    "brandingConfig" JSONB NOT NULL,
    "passwordPolicy" JSONB NOT NULL,
    "sessionTimeoutSeconds" INTEGER NOT NULL DEFAULT 3600,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlags" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "planRequired" TEXT NOT NULL,
    "beta" BOOLEAN NOT NULL DEFAULT false,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "FeatureFlags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageObjects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "md5Checksum" TEXT NOT NULL,
    "virusScanPassed" BOOLEAN NOT NULL DEFAULT true,
    "ownerUserId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StorageObjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileUploads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "chunksTotal" INTEGER NOT NULL DEFAULT 1,
    "chunksUploaded" INTEGER NOT NULL DEFAULT 0,
    "storageObjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FileUploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "BackgroundJobStatusEnum" NOT NULL,
    "payload" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "scheduledRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BackgroundJobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecutions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "backgroundJobId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "executionDurationMs" INTEGER NOT NULL,
    "memoryPeakBytes" BIGINT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "JobExecutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerJobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "jobPayload" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SchedulerJobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "schedulerJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "executionDurationMs" INTEGER NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SchedulerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "keyDisplayName" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "algorithm" TEXT NOT NULL DEFAULT 'pgp-sym',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "lastRotatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "ApiKeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integrationName" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "requestMethod" TEXT NOT NULL DEFAULT 'POST',
    "responseCode" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "responsePayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ApiLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHealthLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cpuUtilizationPct" DECIMAL(65,30) NOT NULL,
    "memoryUtilizationPct" DECIMAL(65,30) NOT NULL,
    "diskUtilizationPct" DECIMAL(65,30) NOT NULL,
    "dbConnectionsCount" INTEGER NOT NULL,
    "redisConnected" BOOLEAN NOT NULL DEFAULT true,
    "metricsPayload" JSONB NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SystemHealthLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "errorSeverity" TEXT NOT NULL DEFAULT 'ERROR',
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT NOT NULL,
    "resolvedStatus" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3) NOT NULL,
    "resolvedByUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ErrorLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfigurations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "configValue" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SystemConfigurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformEvents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventTopic" TEXT NOT NULL,
    "eventPayload" JSONB NOT NULL,
    "triggeredByUser" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PlatformEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAuditLogs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" "PlatformAuditEventEnum" NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PlatformAuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuGroups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultExpanded" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "MenuGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuMaster" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "menuGroupId" TEXT NOT NULL,
    "parentMenuId" TEXT NOT NULL,
    "menuCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "featureId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "pageType" TEXT NOT NULL DEFAULT 'PAGE',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "licenseKey" TEXT NOT NULL,
    "featureFlagKey" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "workflowEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workflowKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "MenuMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionGroups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "PermissionGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleMenuVisibility" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "visibilityMode" TEXT NOT NULL DEFAULT 'ALLOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "RoleMenuVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleTemplates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleCode" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "RoleTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionDependencies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "requiresPermissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "PermissionDependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleInheritance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "inheritsRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "RoleInheritance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionConditions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rolePermissionId" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "conditionRule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "PermissionConditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflows" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowCode" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "allowParallel" BOOLEAN NOT NULL DEFAULT false,
    "allowCancel" BOOLEAN NOT NULL DEFAULT true,
    "autoComplete" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStates" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStates_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "WorkflowActions" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actionCategory" TEXT NOT NULL DEFAULT 'USER',
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowActions_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "WorkflowSteps" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" TEXT NOT NULL DEFAULT 'APPROVAL',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "allowSkip" BOOLEAN NOT NULL DEFAULT false,
    "requiredPermission" TEXT NOT NULL,
    "assignmentStrategy" TEXT NOT NULL DEFAULT 'PERMISSION',
    "assignmentConfig" JSONB NOT NULL,
    "timeoutHours" INTEGER NOT NULL DEFAULT 0,
    "escalationStrategy" TEXT NOT NULL DEFAULT 'NEXT_APPROVER',
    "escalationStepId" TEXT NOT NULL,
    "notificationTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRequests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityVersion" INTEGER NOT NULL DEFAULT 1,
    "entitySnapshot" JSONB NOT NULL,
    "currentStepId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "initiatorId" TEXT NOT NULL,
    "currentAssigneeUserId" TEXT NOT NULL,
    "currentAssigneeGroup" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStepId" TEXT NOT NULL,
    "toStepId" TEXT NOT NULL,
    "actionCode" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "fromAssigneeUserId" TEXT NOT NULL,
    "toAssigneeUserId" TEXT NOT NULL,
    "fromAssigneeGroup" TEXT NOT NULL,
    "toAssigneeGroup" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowComments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "commentType" TEXT NOT NULL DEFAULT 'GENERAL',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowComments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowAttachments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNotifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL DEFAULT 'EMAIL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetry" INTEGER NOT NULL DEFAULT 3,
    "lastAttempt" TIMESTAMP(3) NOT NULL,
    "nextRetryAt" TIMESTAMP(3) NOT NULL,
    "errorLog" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowNotifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDelegations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "originalUserId" TEXT NOT NULL,
    "delegateUserId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3) NOT NULL,
    "delegationType" TEXT NOT NULL DEFAULT 'TEMPORARY',
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowDelegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEscalations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "escalatedFromStepId" TEXT NOT NULL,
    "escalatedToStepId" TEXT NOT NULL,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "targetStrategy" TEXT NOT NULL,
    "afterMinutes" INTEGER NOT NULL,
    "escalatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "executedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowEscalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransitions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actionCode" TEXT NOT NULL,
    "requiresComment" BOOLEAN NOT NULL DEFAULT false,
    "conditionExpression" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "transitionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowTransitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNotificationDeadLetters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "originalNotificationId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL DEFAULT 'EMAIL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetry" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT NOT NULL,
    "deadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "WorkflowNotificationDeadLetters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyCategories" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "PolicyCategories_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "PolicySettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'STRING',
    "defaultValue" JSONB NOT NULL,
    "validationRule" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "tenantOverride" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "PolicySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB NOT NULL,
    "newValue" JSONB NOT NULL,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'STRING',
    "description" TEXT NOT NULL,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Countries" (
    "id" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "numericCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "phoneCode" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "flagEmoji" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "States" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STATE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "States_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Languages" (
    "code" TEXT NOT NULL,
    "iso6391" TEXT NOT NULL,
    "iso6392" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "isRtl" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Currencies" (
    "code" TEXT NOT NULL,
    "numericCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "symbolNative" TEXT NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Timezones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utcOffset" TEXT NOT NULL,
    "utcOffsetMinutes" INTEGER NOT NULL,
    "observesDst" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Timezones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locales" (
    "code" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "countryIso2" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "Locales_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "FileTypes" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxSizeBytes" BIGINT NOT NULL,
    "allowedMimeCategories" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "FileTypes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "MimeTypes" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileTypeCode" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "MimeTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageProviders" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "configSchema" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "StorageProviders_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ErrorCodes" (
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "httpStatus" INTEGER NOT NULL DEFAULT 400,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "ErrorCodes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "UnitsOfMeasure" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "baseUnit" TEXT NOT NULL,
    "conversionFactor" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "UnitsOfMeasure_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "CountriesPhoneCodes" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "phoneCode" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "mobileLengthMin" INTEGER NOT NULL,
    "mobileLengthMax" INTEGER NOT NULL,
    "landlineLengthMin" INTEGER NOT NULL,
    "landlineLengthMax" INTEGER NOT NULL,
    "nationalPrefix" TEXT NOT NULL,
    "validationRegex" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "CountriesPhoneCodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateFormats" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formatPattern" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "exampleOutput" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "DateFormats_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institutes_code_key" ON "Institutes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Institutes_slug_key" ON "Institutes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Institutes_email_key" ON "Institutes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Branches_code_key" ON "Branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Branches_slug_key" ON "Branches"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Branches_email_key" ON "Branches"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Branches_tenantId_id_key" ON "Branches"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Branches_tenantId_code_key" ON "Branches"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Branches_tenantId_slug_key" ON "Branches"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYears_code_key" ON "AcademicYears"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYears_tenantId_id_key" ON "AcademicYears"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYears_tenantId_code_key" ON "AcademicYears"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Departments_code_key" ON "Departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Departments_tenantId_id_key" ON "Departments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Departments_tenantId_code_key" ON "Departments"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BranchDepartments_tenantId_id_key" ON "BranchDepartments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BranchDepartments_tenantId_branchId_departmentId_key" ON "BranchDepartments"("tenantId", "branchId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Designations_code_key" ON "Designations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Designations_tenantId_id_key" ON "Designations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Designations_tenantId_code_key" ON "Designations"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Courses_code_key" ON "Courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Courses_tenantId_id_key" ON "Courses"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Courses_tenantId_code_key" ON "Courses"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Subjects_code_key" ON "Subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subjects_tenantId_id_key" ON "Subjects"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Subjects_tenantId_code_key" ON "Subjects"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSubjects_tenantId_id_key" ON "CourseSubjects"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapters_code_key" ON "Chapters"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Chapters_tenantId_id_key" ON "Chapters"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapters_tenantId_code_key" ON "Chapters"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Topics_code_key" ON "Topics"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Topics_tenantId_id_key" ON "Topics"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Topics_tenantId_code_key" ON "Topics"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BatchDeliveryTypes_code_key" ON "BatchDeliveryTypes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BatchDeliveryTypes_tenantId_id_key" ON "BatchDeliveryTypes"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BatchDeliveryTypes_tenantId_code_key" ON "BatchDeliveryTypes"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Batches_code_key" ON "Batches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Batches_tenantId_id_key" ON "Batches"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Batches_tenantId_code_key" ON "Batches"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Users_tenantId_email_key" ON "Users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_tenantId_id_key" ON "Users"("tenantId", "id");

-- CreateIndex
CREATE INDEX "Roles_tenantId_priority_idx" ON "Roles"("tenantId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_code_key" ON "Roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_tenantId_id_key" ON "Roles"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_tenantId_code_key" ON "Roles"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Permissions_tenantId_resource_action_idx" ON "Permissions"("tenantId", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_tenantId_id_key" ON "Permissions"("tenantId", "id");

-- CreateIndex
CREATE INDEX "RolePermissions_tenantId_roleId_idx" ON "RolePermissions"("tenantId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_tenantId_id_key" ON "RolePermissions"("tenantId", "id");

-- CreateIndex
CREATE INDEX "UserRoles_tenantId_userId_effectiveFrom_effectiveTo_idx" ON "UserRoles"("tenantId", "userId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoles_tenantId_id_key" ON "UserRoles"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Menus_code_key" ON "Menus"("code");

-- CreateIndex
CREATE INDEX "MenuPermissions_tenantId_menuId_idx" ON "MenuPermissions"("tenantId", "menuId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPermissions_tenantId_id_key" ON "MenuPermissions"("tenantId", "id");

-- CreateIndex
CREATE INDEX "AuthEvents_userId_createdAt_idx" ON "AuthEvents"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthEvents_eventType_createdAt_idx" ON "AuthEvents"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetTokens_hashedToken_idx" ON "PasswordResetTokens"("hashedToken");

-- CreateIndex
CREATE INDEX "PasswordResetTokens_userId_expiresAt_idx" ON "PasswordResetTokens"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAdmissions_tenantId_id_key" ON "StudentAdmissions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAdmissions_tenantId_admissionNumber_key" ON "StudentAdmissions"("tenantId", "admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentBatchEnrollments_tenantId_id_key" ON "StudentBatchEnrollments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDepartments_tenantId_branchId_departmentId_key" ON "StaffDepartments"("tenantId", "branchId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentDocuments_tenantId_id_key" ON "StudentDocuments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffBatchAssignments_tenantId_id_key" ON "StaffBatchAssignments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffQualifications_tenantId_id_key" ON "StaffQualifications"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyContacts_email_key" ON "EmergencyContacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyContacts_tenantId_id_key" ON "EmergencyContacts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffEmploymentHistory_tenantId_id_key" ON "StaffEmploymentHistory"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentStatusHistory_tenantId_id_key" ON "StudentStatusHistory"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PersonIdentifiers_tenantId_id_key" ON "PersonIdentifiers"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSessions_tenantId_id_key" ON "AttendanceSessions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecords_tenantId_id_key" ON "AttendanceRecords"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRequests_tenantId_id_key" ON "LeaveRequests"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceAdjustments_tenantId_id_key" ON "AttendanceAdjustments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveAttachments_tenantId_id_key" ON "LeaveAttachments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Exams_tenantId_id_key" ON "Exams"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSections_tenantId_id_key" ON "ExamSections"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSections_examId_displayOrder_key" ON "ExamSections"("examId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestions_tenantId_id_key" ON "ExamQuestions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestions_examId_displayOrder_key" ON "ExamQuestions"("examId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPapers_tenantId_id_key" ON "QuestionPapers"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPapers_tenantId_paperCode_key" ON "QuestionPapers"("tenantId", "paperCode");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaperQuestions_tenantId_id_key" ON "QuestionPaperQuestions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaperQuestions_paperId_questionId_key" ON "QuestionPaperQuestions"("paperId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaperQuestions_paperId_displayOrder_key" ON "QuestionPaperQuestions"("paperId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaperQuestions_questionId_version_key" ON "QuestionPaperQuestions"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaperQuestions_questionId_key" ON "QuestionPaperQuestions"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRegistrations_tenantId_id_key" ON "ExamRegistrations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRegistrations_examId_studentAdmissionId_key" ON "ExamRegistrations"("examId", "studentAdmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempts_tenantId_id_key" ON "ExamAttempts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempts_examId_studentAdmissionId_key" ON "ExamAttempts"("examId", "studentAdmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswers_tenantId_id_key" ON "ExamAnswers"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswers_attemptId_questionId_key" ON "ExamAnswers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswers_questionId_version_key" ON "ExamAnswers"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswers_questionId_key" ON "ExamAnswers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResults_tenantId_id_key" ON "ExamResults"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResults_examId_studentAdmissionId_key" ON "ExamResults"("examId", "studentAdmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResults_examId_attemptId_key" ON "ExamResults"("examId", "attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResultHistory_tenantId_id_key" ON "ExamResultHistory"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamDocuments_tenantId_id_key" ON "ExamDocuments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ExamDocuments_examId_displayOrder_key" ON "ExamDocuments"("examId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Questions_tenantId_id_key" ON "Questions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOptions_tenantId_id_key" ON "QuestionOptions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOptions_questionId_optionLabel_key" ON "QuestionOptions"("questionId", "optionLabel");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOptions_questionId_version_key" ON "QuestionOptions"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOptions_questionId_key" ON "QuestionOptions"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionExplanations_tenantId_id_key" ON "QuestionExplanations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionExplanations_questionId_language_key" ON "QuestionExplanations"("questionId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionExplanations_questionId_version_key" ON "QuestionExplanations"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionExplanations_questionId_key" ON "QuestionExplanations"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTags_tenantId_id_key" ON "QuestionTags"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTags_tenantId_tagName_key" ON "QuestionTags"("tenantId", "tagName");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTagMappings_tenantId_id_key" ON "QuestionTagMappings"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTagMappings_questionId_tagId_key" ON "QuestionTagMappings"("questionId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTagMappings_questionId_version_key" ON "QuestionTagMappings"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTagMappings_questionId_key" ON "QuestionTagMappings"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersions_tenantId_id_key" ON "QuestionVersions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersions_questionId_version_key" ON "QuestionVersions"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersions_questionId_key" ON "QuestionVersions"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttachments_tenantId_id_key" ON "QuestionAttachments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttachments_questionId_version_key" ON "QuestionAttachments"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttachments_questionId_key" ON "QuestionAttachments"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionReviews_tenantId_id_key" ON "QuestionReviews"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionReviews_questionId_version_key" ON "QuestionReviews"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionReviews_questionId_key" ON "QuestionReviews"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionUsage_tenantId_id_key" ON "QuestionUsage"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionUsage_questionId_version_key" ON "QuestionUsage"("questionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionUsage_questionId_key" ON "QuestionUsage"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionImportJobs_tenantId_id_key" ON "QuestionImportJobs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningMaterials_tenantId_id_key" ON "LearningMaterials"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningMaterials_tenantId_materialCode_key" ON "LearningMaterials"("tenantId", "materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialVersions_tenantId_id_key" ON "MaterialVersions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialVersions_materialId_version_key" ON "MaterialVersions"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialVersions_materialId_key" ON "MaterialVersions"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAttachments_tenantId_id_key" ON "MaterialAttachments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAttachments_materialId_version_key" ON "MaterialAttachments"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAttachments_materialId_key" ON "MaterialAttachments"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPaths_tenantId_id_key" ON "LearningPaths"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathMaterials_tenantId_id_key" ON "LearningPathMaterials"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathMaterials_materialId_version_key" ON "LearningPathMaterials"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathMaterials_pathId_materialId_key" ON "LearningPathMaterials"("pathId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathMaterials_pathId_displayOrder_key" ON "LearningPathMaterials"("pathId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathMaterials_materialId_key" ON "LearningPathMaterials"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentLearningProgress_tenantId_id_key" ON "StudentLearningProgress"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentLearningProgress_materialId_version_key" ON "StudentLearningProgress"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "StudentLearningProgress_studentAdmissionId_materialId_key" ON "StudentLearningProgress"("studentAdmissionId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentLearningProgress_materialId_key" ON "StudentLearningProgress"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningBookmarks_tenantId_id_key" ON "LearningBookmarks"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningBookmarks_materialId_version_key" ON "LearningBookmarks"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LearningBookmarks_materialId_key" ON "LearningBookmarks"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningNotes_tenantId_id_key" ON "LearningNotes"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningNotes_materialId_version_key" ON "LearningNotes"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LearningNotes_materialId_key" ON "LearningNotes"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialDiscussions_tenantId_id_key" ON "MaterialDiscussions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialDiscussions_materialId_version_key" ON "MaterialDiscussions"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialDiscussions_materialId_key" ON "MaterialDiscussions"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAssignments_tenantId_id_key" ON "MaterialAssignments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAssignments_materialId_version_key" ON "MaterialAssignments"("materialId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialAssignments_materialId_key" ON "MaterialAssignments"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmissions_tenantId_id_key" ON "AssignmentSubmissions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmissions_assignmentId_studentAdmissionId_attem_key" ON "AssignmentSubmissions"("assignmentId", "studentAdmissionId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClasses_tenantId_id_key" ON "LiveClasses"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassInstructors_tenantId_id_key" ON "LiveClassInstructors"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassSessions_tenantId_id_key" ON "LiveClassSessions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassParticipants_tenantId_id_key" ON "LiveClassParticipants"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassAttendance_tenantId_id_key" ON "LiveClassAttendance"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassRecordings_tenantId_id_key" ON "LiveClassRecordings"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassResources_tenantId_id_key" ON "LiveClassResources"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassChatMessages_tenantId_id_key" ON "LiveClassChatMessages"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassPolls_tenantId_id_key" ON "LiveClassPolls"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassPollResponses_tenantId_id_key" ON "LiveClassPollResponses"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassWhiteboardSnapshots_tenantId_id_key" ON "LiveClassWhiteboardSnapshots"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassRaiseHands_tenantId_id_key" ON "LiveClassRaiseHands"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassBreakoutRooms_tenantId_id_key" ON "LiveClassBreakoutRooms"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BreakoutRoomParticipants_tenantId_id_key" ON "BreakoutRoomParticipants"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassEvents_tenantId_id_key" ON "LiveClassEvents"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructures_code_key" ON "FeeStructures"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructures_tenantId_id_key" ON "FeeStructures"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructures_tenantId_branchId_departmentId_key" ON "FeeStructures"("tenantId", "branchId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructures_tenantId_code_key" ON "FeeStructures"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureItems_tenantId_id_key" ON "FeeStructureItems"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeAssignments_tenantId_id_key" ON "StudentFeeAssignments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeInstallments_tenantId_id_key" ON "FeeInstallments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeInstallments_tenantId_id_key" ON "StudentFeeInstallments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayments_tenantId_id_key" ON "FeePayments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransactions_tenantId_id_key" ON "PaymentTransactions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefunds_tenantId_id_key" ON "PaymentRefunds"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeDiscounts_code_key" ON "FeeDiscounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FeeDiscounts_tenantId_id_key" ON "FeeDiscounts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeDiscounts_tenantId_code_key" ON "FeeDiscounts"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeDiscounts_tenantId_id_key" ON "StudentFeeDiscounts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeePenalties_code_key" ON "FeePenalties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FeePenalties_tenantId_id_key" ON "FeePenalties"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeePenalties_tenantId_code_key" ON "FeePenalties"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeePenalties_tenantId_id_key" ON "StudentFeePenalties"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeReceipts_tenantId_id_key" ON "FeeReceipts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarships_tenantId_id_key" ON "Scholarships"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeWaivers_tenantId_id_key" ON "FeeWaivers"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReconciliation_tenantId_id_key" ON "PaymentReconciliation"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeNotifications_tenantId_id_key" ON "FeeNotifications"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAuditLogs_tenantId_id_key" ON "FeeAuditLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAdjustments_tenantId_id_key" ON "FeeAdjustments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocations_tenantId_id_key" ON "PaymentAllocations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCollectionClosures_tenantId_id_key" ON "FeeCollectionClosures"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCollectionCenters_code_key" ON "FeeCollectionCenters"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCollectionCenters_tenantId_id_key" ON "FeeCollectionCenters"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCollectionCenters_tenantId_code_key" ON "FeeCollectionCenters"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriodsMapping_code_key" ON "FinancialPeriodsMapping"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriodsMapping_tenantId_id_key" ON "FinancialPeriodsMapping"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriodsMapping_tenantId_code_key" ON "FinancialPeriodsMapping"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplates_code_key" ON "NotificationTemplates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplates_tenantId_id_key" ON "NotificationTemplates"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplates_tenantId_code_key" ON "NotificationTemplates"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplateVersions_tenantId_id_key" ON "NotificationTemplateVersions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationCampaigns_tenantId_id_key" ON "NotificationCampaigns"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationCampaignTargets_tenantId_id_key" ON "NotificationCampaignTargets"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationQueue_tenantId_id_key" ON "NotificationQueue"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDeliveries_tenantId_id_key" ON "NotificationDeliveries"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationChannels_code_key" ON "NotificationChannels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_tenantId_id_key" ON "NotificationPreferences"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSubscriptions_tenantId_id_key" ON "NotificationSubscriptions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLogs_tenantId_id_key" ON "NotificationLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SmsProviders_code_key" ON "SmsProviders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SmsProviders_tenantId_id_key" ON "SmsProviders"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SmsProviders_tenantId_code_key" ON "SmsProviders"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "EmailProviders_code_key" ON "EmailProviders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EmailProviders_tenantId_id_key" ON "EmailProviders"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailProviders_tenantId_code_key" ON "EmailProviders"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappProviders_code_key" ON "WhatsappProviders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappProviders_tenantId_id_key" ON "WhatsappProviders"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappProviders_tenantId_code_key" ON "WhatsappProviders"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PushDevices_tenantId_id_key" ON "PushDevices"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotifications_tenantId_id_key" ON "PushNotifications"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Announcements_tenantId_id_key" ON "Announcements"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReads_tenantId_id_key" ON "AnnouncementReads"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvents_tenantId_id_key" ON "WebhookEvents"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDeliveries_tenantId_id_key" ON "WebhookDeliveries"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationAuditLogs_tenantId_id_key" ON "CommunicationAuditLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAttachments_tenantId_id_key" ON "NotificationAttachments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationVariables_code_key" ON "NotificationVariables"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationVariables_tenantId_id_key" ON "NotificationVariables"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationVariables_tenantId_code_key" ON "NotificationVariables"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRetryQueue_tenantId_id_key" ON "NotificationRetryQueue"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationRateLimits_tenantId_id_key" ON "CommunicationRateLimits"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderFailovers_tenantId_id_key" ON "ProviderFailovers"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardDefinitions_code_key" ON "DashboardDefinitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardDefinitions_tenantId_id_key" ON "DashboardDefinitions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardDefinitions_tenantId_code_key" ON "DashboardDefinitions"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidgets_tenantId_id_key" ON "DashboardWidgets"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReportDefinitions_code_key" ON "ReportDefinitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReportDefinitions_tenantId_id_key" ON "ReportDefinitions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReportDefinitions_tenantId_code_key" ON "ReportDefinitions"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ReportExecutions_tenantId_id_key" ON "ReportExecutions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KpiDefinitions_code_key" ON "KpiDefinitions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KpiDefinitions_tenantId_id_key" ON "KpiDefinitions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KpiDefinitions_tenantId_code_key" ON "KpiDefinitions"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "KpiSnapshots_tenantId_id_key" ON "KpiSnapshots"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAnalytics_tenantId_id_key" ON "StudentAnalytics"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BranchAnalytics_tenantId_id_key" ON "BranchAnalytics"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAnalytics_tenantId_id_key" ON "FinancialAnalytics"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsRefreshJobs_tenantId_id_key" ON "AnalyticsRefreshJobs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsAuditLogs_tenantId_id_key" ON "AnalyticsAuditLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviders_code_key" ON "AiProviders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviders_tenantId_id_key" ON "AiProviders"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviders_tenantId_code_key" ON "AiProviders"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AiModels_code_key" ON "AiModels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AiModels_tenantId_id_key" ON "AiModels"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiModels_tenantId_code_key" ON "AiModels"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AiPrompts_code_key" ON "AiPrompts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AiPrompts_tenantId_id_key" ON "AiPrompts"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiPrompts_tenantId_code_key" ON "AiPrompts"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AiConversations_tenantId_id_key" ON "AiConversations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiMessages_tenantId_id_key" ON "AiMessages"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiRequests_tenantId_id_key" ON "AiRequests"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiGeneratedContent_tenantId_id_key" ON "AiGeneratedContent"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiFeedback_tenantId_id_key" ON "AiFeedback"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageLogs_tenantId_id_key" ON "AiUsageLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiAuditLogs_tenantId_id_key" ON "AiAuditLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_id_key" ON "TenantSettings"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlags_tenantId_id_key" ON "FeatureFlags"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlags_tenantId_featureKey_key" ON "FeatureFlags"("tenantId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "StorageObjects_tenantId_id_key" ON "StorageObjects"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FileUploads_tenantId_id_key" ON "FileUploads"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundJobs_tenantId_id_key" ON "BackgroundJobs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "JobExecutions_tenantId_id_key" ON "JobExecutions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulerJobs_code_key" ON "SchedulerJobs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulerJobs_tenantId_id_key" ON "SchedulerJobs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulerJobs_tenantId_code_key" ON "SchedulerJobs"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulerHistory_tenantId_id_key" ON "SchedulerHistory"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_tenantId_id_key" ON "ApiKeys"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_tenantId_service_key" ON "ApiKeys"("tenantId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "ApiLogs_tenantId_id_key" ON "ApiLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemHealthLogs_tenantId_id_key" ON "SystemHealthLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorLogs_tenantId_id_key" ON "ErrorLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfigurations_tenantId_id_key" ON "SystemConfigurations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformEvents_tenantId_id_key" ON "PlatformEvents"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAuditLogs_tenantId_id_key" ON "PlatformAuditLogs"("tenantId", "id");

-- CreateIndex
CREATE INDEX "MenuGroups_tenantId_displayOrder_isVisible_idx" ON "MenuGroups"("tenantId", "displayOrder", "isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "MenuGroups_code_key" ON "MenuGroups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MenuGroups_slug_key" ON "MenuGroups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MenuGroups_tenantId_id_key" ON "MenuGroups"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MenuGroups_tenantId_code_key" ON "MenuGroups"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "MenuGroups_tenantId_slug_key" ON "MenuGroups"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "MenuMaster_tenantId_menuGroupId_parentMenuId_displayOrder_idx" ON "MenuMaster"("tenantId", "menuGroupId", "parentMenuId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MenuMaster_tenantId_id_key" ON "MenuMaster"("tenantId", "id");

-- CreateIndex
CREATE INDEX "PermissionGroups_tenantId_displayOrder_idx" ON "PermissionGroups"("tenantId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionGroups_code_key" ON "PermissionGroups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionGroups_tenantId_id_key" ON "PermissionGroups"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionGroups_tenantId_code_key" ON "PermissionGroups"("tenantId", "code");

-- CreateIndex
CREATE INDEX "RoleMenuVisibility_tenantId_roleId_idx" ON "RoleMenuVisibility"("tenantId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleMenuVisibility_tenantId_id_key" ON "RoleMenuVisibility"("tenantId", "id");

-- CreateIndex
CREATE INDEX "RoleTemplates_tenantId_roleCode_idx" ON "RoleTemplates"("tenantId", "roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "RoleTemplates_tenantId_id_key" ON "RoleTemplates"("tenantId", "id");

-- CreateIndex
CREATE INDEX "PermissionDependencies_tenantId_permissionId_idx" ON "PermissionDependencies"("tenantId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionDependencies_tenantId_id_key" ON "PermissionDependencies"("tenantId", "id");

-- CreateIndex
CREATE INDEX "RoleInheritance_tenantId_roleId_idx" ON "RoleInheritance"("tenantId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleInheritance_tenantId_id_key" ON "RoleInheritance"("tenantId", "id");

-- CreateIndex
CREATE INDEX "PermissionConditions_tenantId_rolePermissionId_idx" ON "PermissionConditions"("tenantId", "rolePermissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionConditions_tenantId_id_key" ON "PermissionConditions"("tenantId", "id");

-- CreateIndex
CREATE INDEX "Workflows_tenantId_isActive_idx" ON "Workflows"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Workflows_tenantId_id_key" ON "Workflows"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Workflows_tenantId_workflowCode_workflowVersion_key" ON "Workflows"("tenantId", "workflowCode", "workflowVersion");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStates_code_key" ON "WorkflowStates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowActions_code_key" ON "WorkflowActions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowSteps_tenantId_id_key" ON "WorkflowSteps"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowSteps_tenantId_workflowId_stepOrder_key" ON "WorkflowSteps"("tenantId", "workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowRequests_tenantId_entityType_entityId_idx" ON "WorkflowRequests"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRequests_tenantId_id_key" ON "WorkflowRequests"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowHistory_tenantId_id_key" ON "WorkflowHistory"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowComments_tenantId_id_key" ON "WorkflowComments"("tenantId", "id");

-- CreateIndex
CREATE INDEX "WorkflowAttachments_tenantId_requestId_idx" ON "WorkflowAttachments"("tenantId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowAttachments_tenantId_id_key" ON "WorkflowAttachments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowNotifications_tenantId_id_key" ON "WorkflowNotifications"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDelegations_tenantId_id_key" ON "WorkflowDelegations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowEscalations_tenantId_id_key" ON "WorkflowEscalations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransitions_tenantId_id_key" ON "WorkflowTransitions"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransitions_tenantId_workflowId_fromStatus_actionCo_key" ON "WorkflowTransitions"("tenantId", "workflowId", "fromStatus", "actionCode", "toStatus");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowNotificationDeadLetters_tenantId_id_key" ON "WorkflowNotificationDeadLetters"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyCategories_code_key" ON "PolicyCategories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PolicySettings_tenantId_id_key" ON "PolicySettings"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PolicySettings_tenantId_policyKey_key" ON "PolicySettings"("tenantId", "policyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogs_tenantId_id_key" ON "AuditLogs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_settingKey_key" ON "SystemSettings"("settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "Countries_iso2_key" ON "Countries"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "Countries_iso3_key" ON "Countries"("iso3");

-- CreateIndex
CREATE UNIQUE INDEX "Countries_numericCode_key" ON "Countries"("numericCode");

-- CreateIndex
CREATE UNIQUE INDEX "States_code_key" ON "States"("code");

-- CreateIndex
CREATE UNIQUE INDEX "States_countryId_code_key" ON "States"("countryId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Languages_code_key" ON "Languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Languages_iso6391_key" ON "Languages"("iso6391");

-- CreateIndex
CREATE UNIQUE INDEX "Languages_iso6392_key" ON "Languages"("iso6392");

-- CreateIndex
CREATE UNIQUE INDEX "Currencies_numericCode_key" ON "Currencies"("numericCode");

-- CreateIndex
CREATE UNIQUE INDEX "Currencies_code_key" ON "Currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Timezones_name_key" ON "Timezones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Locales_code_key" ON "Locales"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Locales_languageCode_countryIso2_key" ON "Locales"("languageCode", "countryIso2");

-- CreateIndex
CREATE UNIQUE INDEX "FileTypes_code_key" ON "FileTypes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MimeTypes_mimeType_key" ON "MimeTypes"("mimeType");

-- CreateIndex
CREATE UNIQUE INDEX "StorageProviders_code_key" ON "StorageProviders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorCodes_code_key" ON "ErrorCodes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UnitsOfMeasure_code_key" ON "UnitsOfMeasure"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CountriesPhoneCodes_countryId_phoneCode_key" ON "CountriesPhoneCodes"("countryId", "phoneCode");

-- CreateIndex
CREATE UNIQUE INDEX "DateFormats_code_key" ON "DateFormats"("code");

-- AddForeignKey
ALTER TABLE "Branches" ADD CONSTRAINT "Branches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYears" ADD CONSTRAINT "AcademicYears_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departments" ADD CONSTRAINT "Departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchDepartments" ADD CONSTRAINT "BranchDepartments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designations" ADD CONSTRAINT "Designations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Courses" ADD CONSTRAINT "Courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubjects" ADD CONSTRAINT "CourseSubjects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapters" ADD CONSTRAINT "Chapters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topics" ADD CONSTRAINT "Topics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchDeliveryTypes" ADD CONSTRAINT "BatchDeliveryTypes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batches" ADD CONSTRAINT "Batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permissions" ADD CONSTRAINT "Permissions_permissionGroupId_fkey" FOREIGN KEY ("permissionGroupId") REFERENCES "PermissionGroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menus" ADD CONSTRAINT "Menus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPermissions" ADD CONSTRAINT "MenuPermissions_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MenuMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPermissions" ADD CONSTRAINT "MenuPermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSessions" ADD CONSTRAINT "UserSessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthEvents" ADD CONSTRAINT "AuthEvents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthEvents" ADD CONSTRAINT "AuthEvents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetTokens" ADD CONSTRAINT "PasswordResetTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfiles" ADD CONSTRAINT "StaffProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfiles" ADD CONSTRAINT "StaffProfiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfiles" ADD CONSTRAINT "StaffProfiles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfiles" ADD CONSTRAINT "StaffProfiles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfiles" ADD CONSTRAINT "StaffProfiles_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfiles" ADD CONSTRAINT "StudentProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfiles" ADD CONSTRAINT "StudentProfiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfiles" ADD CONSTRAINT "StudentProfiles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfiles" ADD CONSTRAINT "StudentProfiles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfiles" ADD CONSTRAINT "StudentProfiles_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfiles" ADD CONSTRAINT "ParentProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfiles" ADD CONSTRAINT "ParentProfiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfiles" ADD CONSTRAINT "ParentProfiles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfiles" ADD CONSTRAINT "ParentProfiles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfiles" ADD CONSTRAINT "ParentProfiles_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParents" ADD CONSTRAINT "StudentParents_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParents" ADD CONSTRAINT "StudentParents_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "ParentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParents" ADD CONSTRAINT "StudentParents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentParents" ADD CONSTRAINT "StudentParents_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissions" ADD CONSTRAINT "StudentAdmissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissions" ADD CONSTRAINT "StudentAdmissions_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissions" ADD CONSTRAINT "StudentAdmissions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissions" ADD CONSTRAINT "StudentAdmissions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAdmissions" ADD CONSTRAINT "StudentAdmissions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBatchEnrollments" ADD CONSTRAINT "StudentBatchEnrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBatchEnrollments" ADD CONSTRAINT "StudentBatchEnrollments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBatchEnrollments" ADD CONSTRAINT "StudentBatchEnrollments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBatchEnrollments" ADD CONSTRAINT "StudentBatchEnrollments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDepartments" ADD CONSTRAINT "StaffDepartments_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDepartments" ADD CONSTRAINT "StaffDepartments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDepartments" ADD CONSTRAINT "StaffDepartments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDepartments" ADD CONSTRAINT "StaffDepartments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDepartments" ADD CONSTRAINT "StaffDepartments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubjects" ADD CONSTRAINT "StaffSubjects_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubjects" ADD CONSTRAINT "StaffSubjects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubjects" ADD CONSTRAINT "StaffSubjects_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubjects" ADD CONSTRAINT "StaffSubjects_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubjects" ADD CONSTRAINT "StaffSubjects_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocuments" ADD CONSTRAINT "StudentDocuments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocuments" ADD CONSTRAINT "StudentDocuments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocuments" ADD CONSTRAINT "StudentDocuments_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocuments" ADD CONSTRAINT "StudentDocuments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocuments" ADD CONSTRAINT "StudentDocuments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocuments" ADD CONSTRAINT "StudentDocuments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBatchAssignments" ADD CONSTRAINT "StaffBatchAssignments_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBatchAssignments" ADD CONSTRAINT "StaffBatchAssignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBatchAssignments" ADD CONSTRAINT "StaffBatchAssignments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBatchAssignments" ADD CONSTRAINT "StaffBatchAssignments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBatchAssignments" ADD CONSTRAINT "StaffBatchAssignments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMedicalProfiles" ADD CONSTRAINT "StudentMedicalProfiles_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMedicalProfiles" ADD CONSTRAINT "StudentMedicalProfiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMedicalProfiles" ADD CONSTRAINT "StudentMedicalProfiles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMedicalProfiles" ADD CONSTRAINT "StudentMedicalProfiles_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMedicalProfiles" ADD CONSTRAINT "StudentMedicalProfiles_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffQualifications" ADD CONSTRAINT "StaffQualifications_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffQualifications" ADD CONSTRAINT "StaffQualifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffQualifications" ADD CONSTRAINT "StaffQualifications_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffQualifications" ADD CONSTRAINT "StaffQualifications_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffQualifications" ADD CONSTRAINT "StaffQualifications_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContacts" ADD CONSTRAINT "EmergencyContacts_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContacts" ADD CONSTRAINT "EmergencyContacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContacts" ADD CONSTRAINT "EmergencyContacts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContacts" ADD CONSTRAINT "EmergencyContacts_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContacts" ADD CONSTRAINT "EmergencyContacts_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffEmploymentHistory" ADD CONSTRAINT "StaffEmploymentHistory_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffEmploymentHistory" ADD CONSTRAINT "StaffEmploymentHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffEmploymentHistory" ADD CONSTRAINT "StaffEmploymentHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIdentifiers" ADD CONSTRAINT "PersonIdentifiers_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIdentifiers" ADD CONSTRAINT "PersonIdentifiers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIdentifiers" ADD CONSTRAINT "PersonIdentifiers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIdentifiers" ADD CONSTRAINT "PersonIdentifiers_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonIdentifiers" ADD CONSTRAINT "PersonIdentifiers_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSessions" ADD CONSTRAINT "AttendanceSessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSessions" ADD CONSTRAINT "AttendanceSessions_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSessions" ADD CONSTRAINT "AttendanceSessions_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSessions" ADD CONSTRAINT "AttendanceSessions_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSessions" ADD CONSTRAINT "AttendanceSessions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSessions" ADD CONSTRAINT "AttendanceSessions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSessions" ADD CONSTRAINT "AttendanceSessions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecords" ADD CONSTRAINT "AttendanceRecords_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecords" ADD CONSTRAINT "AttendanceRecords_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecords" ADD CONSTRAINT "AttendanceRecords_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecords" ADD CONSTRAINT "AttendanceRecords_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecords" ADD CONSTRAINT "AttendanceRecords_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecords" ADD CONSTRAINT "AttendanceRecords_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequests" ADD CONSTRAINT "LeaveRequests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequests" ADD CONSTRAINT "LeaveRequests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequests" ADD CONSTRAINT "LeaveRequests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequests" ADD CONSTRAINT "LeaveRequests_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequests" ADD CONSTRAINT "LeaveRequests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequests" ADD CONSTRAINT "LeaveRequests_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequests" ADD CONSTRAINT "LeaveRequests_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAdjustments" ADD CONSTRAINT "AttendanceAdjustments_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecords"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAdjustments" ADD CONSTRAINT "AttendanceAdjustments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAdjustments" ADD CONSTRAINT "AttendanceAdjustments_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAdjustments" ADD CONSTRAINT "AttendanceAdjustments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAttachments" ADD CONSTRAINT "LeaveAttachments_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAttachments" ADD CONSTRAINT "LeaveAttachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAttachments" ADD CONSTRAINT "LeaveAttachments_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAttachments" ADD CONSTRAINT "LeaveAttachments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAttachments" ADD CONSTRAINT "LeaveAttachments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAttachments" ADD CONSTRAINT "LeaveAttachments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_resultsPublishedBy_fkey" FOREIGN KEY ("resultsPublishedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSections" ADD CONSTRAINT "ExamSections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSections" ADD CONSTRAINT "ExamSections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSections" ADD CONSTRAINT "ExamSections_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSections" ADD CONSTRAINT "ExamSections_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestions" ADD CONSTRAINT "ExamQuestions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestions" ADD CONSTRAINT "ExamQuestions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestions" ADD CONSTRAINT "ExamQuestions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestions" ADD CONSTRAINT "ExamQuestions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPapers" ADD CONSTRAINT "QuestionPapers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPapers" ADD CONSTRAINT "QuestionPapers_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPapers" ADD CONSTRAINT "QuestionPapers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPapers" ADD CONSTRAINT "QuestionPapers_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperQuestions" ADD CONSTRAINT "QuestionPaperQuestions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperQuestions" ADD CONSTRAINT "QuestionPaperQuestions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperQuestions" ADD CONSTRAINT "QuestionPaperQuestions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistrations" ADD CONSTRAINT "ExamRegistrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistrations" ADD CONSTRAINT "ExamRegistrations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistrations" ADD CONSTRAINT "ExamRegistrations_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistrations" ADD CONSTRAINT "ExamRegistrations_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempts" ADD CONSTRAINT "ExamAttempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempts" ADD CONSTRAINT "ExamAttempts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempts" ADD CONSTRAINT "ExamAttempts_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempts" ADD CONSTRAINT "ExamAttempts_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswers" ADD CONSTRAINT "ExamAnswers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswers" ADD CONSTRAINT "ExamAnswers_evaluatedBy_fkey" FOREIGN KEY ("evaluatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswers" ADD CONSTRAINT "ExamAnswers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswers" ADD CONSTRAINT "ExamAnswers_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswers" ADD CONSTRAINT "ExamAnswers_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResults" ADD CONSTRAINT "ExamResults_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResults" ADD CONSTRAINT "ExamResults_reEvaluatedBy_fkey" FOREIGN KEY ("reEvaluatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResults" ADD CONSTRAINT "ExamResults_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResults" ADD CONSTRAINT "ExamResults_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResults" ADD CONSTRAINT "ExamResults_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResults" ADD CONSTRAINT "ExamResults_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResultHistory" ADD CONSTRAINT "ExamResultHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResultHistory" ADD CONSTRAINT "ExamResultHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDocuments" ADD CONSTRAINT "ExamDocuments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDocuments" ADD CONSTRAINT "ExamDocuments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDocuments" ADD CONSTRAINT "ExamDocuments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDocuments" ADD CONSTRAINT "ExamDocuments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOptions" ADD CONSTRAINT "QuestionOptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOptions" ADD CONSTRAINT "QuestionOptions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOptions" ADD CONSTRAINT "QuestionOptions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOptions" ADD CONSTRAINT "QuestionOptions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExplanations" ADD CONSTRAINT "QuestionExplanations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExplanations" ADD CONSTRAINT "QuestionExplanations_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExplanations" ADD CONSTRAINT "QuestionExplanations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExplanations" ADD CONSTRAINT "QuestionExplanations_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExplanations" ADD CONSTRAINT "QuestionExplanations_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTags" ADD CONSTRAINT "QuestionTags_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTags" ADD CONSTRAINT "QuestionTags_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTags" ADD CONSTRAINT "QuestionTags_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTags" ADD CONSTRAINT "QuestionTags_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTagMappings" ADD CONSTRAINT "QuestionTagMappings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTagMappings" ADD CONSTRAINT "QuestionTagMappings_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTagMappings" ADD CONSTRAINT "QuestionTagMappings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTagMappings" ADD CONSTRAINT "QuestionTagMappings_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersions" ADD CONSTRAINT "QuestionVersions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersions" ADD CONSTRAINT "QuestionVersions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttachments" ADD CONSTRAINT "QuestionAttachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttachments" ADD CONSTRAINT "QuestionAttachments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttachments" ADD CONSTRAINT "QuestionAttachments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttachments" ADD CONSTRAINT "QuestionAttachments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReviews" ADD CONSTRAINT "QuestionReviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReviews" ADD CONSTRAINT "QuestionReviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReviews" ADD CONSTRAINT "QuestionReviews_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReviews" ADD CONSTRAINT "QuestionReviews_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReviews" ADD CONSTRAINT "QuestionReviews_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionUsage" ADD CONSTRAINT "QuestionUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionUsage" ADD CONSTRAINT "QuestionUsage_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionImportJobs" ADD CONSTRAINT "QuestionImportJobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionImportJobs" ADD CONSTRAINT "QuestionImportJobs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionImportJobs" ADD CONSTRAINT "QuestionImportJobs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionImportJobs" ADD CONSTRAINT "QuestionImportJobs_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterials" ADD CONSTRAINT "LearningMaterials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterials" ADD CONSTRAINT "LearningMaterials_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterials" ADD CONSTRAINT "LearningMaterials_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterials" ADD CONSTRAINT "LearningMaterials_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterials" ADD CONSTRAINT "LearningMaterials_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialVersions" ADD CONSTRAINT "MaterialVersions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialVersions" ADD CONSTRAINT "MaterialVersions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttachments" ADD CONSTRAINT "MaterialAttachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttachments" ADD CONSTRAINT "MaterialAttachments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttachments" ADD CONSTRAINT "MaterialAttachments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttachments" ADD CONSTRAINT "MaterialAttachments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPaths" ADD CONSTRAINT "LearningPaths_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPaths" ADD CONSTRAINT "LearningPaths_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPaths" ADD CONSTRAINT "LearningPaths_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPaths" ADD CONSTRAINT "LearningPaths_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathMaterials" ADD CONSTRAINT "LearningPathMaterials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathMaterials" ADD CONSTRAINT "LearningPathMaterials_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathMaterials" ADD CONSTRAINT "LearningPathMaterials_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathMaterials" ADD CONSTRAINT "LearningPathMaterials_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningProgress" ADD CONSTRAINT "StudentLearningProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningProgress" ADD CONSTRAINT "StudentLearningProgress_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningProgress" ADD CONSTRAINT "StudentLearningProgress_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningProgress" ADD CONSTRAINT "StudentLearningProgress_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningBookmarks" ADD CONSTRAINT "LearningBookmarks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningBookmarks" ADD CONSTRAINT "LearningBookmarks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningBookmarks" ADD CONSTRAINT "LearningBookmarks_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningBookmarks" ADD CONSTRAINT "LearningBookmarks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningBookmarks" ADD CONSTRAINT "LearningBookmarks_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNotes" ADD CONSTRAINT "LearningNotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNotes" ADD CONSTRAINT "LearningNotes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNotes" ADD CONSTRAINT "LearningNotes_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNotes" ADD CONSTRAINT "LearningNotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNotes" ADD CONSTRAINT "LearningNotes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDiscussions" ADD CONSTRAINT "MaterialDiscussions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDiscussions" ADD CONSTRAINT "MaterialDiscussions_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "MaterialDiscussions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDiscussions" ADD CONSTRAINT "MaterialDiscussions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDiscussions" ADD CONSTRAINT "MaterialDiscussions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDiscussions" ADD CONSTRAINT "MaterialDiscussions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDiscussions" ADD CONSTRAINT "MaterialDiscussions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAssignments" ADD CONSTRAINT "MaterialAssignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAssignments" ADD CONSTRAINT "MaterialAssignments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAssignments" ADD CONSTRAINT "MaterialAssignments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAssignments" ADD CONSTRAINT "MaterialAssignments_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmissions" ADD CONSTRAINT "AssignmentSubmissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmissions" ADD CONSTRAINT "AssignmentSubmissions_evaluatedBy_fkey" FOREIGN KEY ("evaluatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmissions" ADD CONSTRAINT "AssignmentSubmissions_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmissions" ADD CONSTRAINT "AssignmentSubmissions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmissions" ADD CONSTRAINT "AssignmentSubmissions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClasses" ADD CONSTRAINT "LiveClasses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassInstructors" ADD CONSTRAINT "LiveClassInstructors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassInstructors" ADD CONSTRAINT "LiveClassInstructors_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassSessions" ADD CONSTRAINT "LiveClassSessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassParticipants" ADD CONSTRAINT "LiveClassParticipants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassAttendance" ADD CONSTRAINT "LiveClassAttendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassAttendance" ADD CONSTRAINT "LiveClassAttendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassRecordings" ADD CONSTRAINT "LiveClassRecordings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassResources" ADD CONSTRAINT "LiveClassResources_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassResources" ADD CONSTRAINT "LiveClassResources_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassChatMessages" ADD CONSTRAINT "LiveClassChatMessages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassChatMessages" ADD CONSTRAINT "LiveClassChatMessages_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "LiveClassChatMessages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassChatMessages" ADD CONSTRAINT "LiveClassChatMessages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassPolls" ADD CONSTRAINT "LiveClassPolls_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassPollResponses" ADD CONSTRAINT "LiveClassPollResponses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassWhiteboardSnapshots" ADD CONSTRAINT "LiveClassWhiteboardSnapshots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassWhiteboardSnapshots" ADD CONSTRAINT "LiveClassWhiteboardSnapshots_capturedBy_fkey" FOREIGN KEY ("capturedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassRaiseHands" ADD CONSTRAINT "LiveClassRaiseHands_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassRaiseHands" ADD CONSTRAINT "LiveClassRaiseHands_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassBreakoutRooms" ADD CONSTRAINT "LiveClassBreakoutRooms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakoutRoomParticipants" ADD CONSTRAINT "BreakoutRoomParticipants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassEvents" ADD CONSTRAINT "LiveClassEvents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassEvents" ADD CONSTRAINT "LiveClassEvents_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructures" ADD CONSTRAINT "FeeStructures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItems" ADD CONSTRAINT "FeeStructureItems_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAssignments" ADD CONSTRAINT "StudentFeeAssignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAssignments" ADD CONSTRAINT "StudentFeeAssignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInstallments" ADD CONSTRAINT "FeeInstallments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeInstallments" ADD CONSTRAINT "StudentFeeInstallments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayments" ADD CONSTRAINT "FeePayments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayments" ADD CONSTRAINT "FeePayments_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransactions" ADD CONSTRAINT "PaymentTransactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRefunds" ADD CONSTRAINT "PaymentRefunds_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRefunds" ADD CONSTRAINT "PaymentRefunds_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDiscounts" ADD CONSTRAINT "FeeDiscounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeDiscounts" ADD CONSTRAINT "StudentFeeDiscounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeDiscounts" ADD CONSTRAINT "StudentFeeDiscounts_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePenalties" ADD CONSTRAINT "FeePenalties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeePenalties" ADD CONSTRAINT "StudentFeePenalties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeePenalties" ADD CONSTRAINT "StudentFeePenalties_waivedBy_fkey" FOREIGN KEY ("waivedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReceipts" ADD CONSTRAINT "FeeReceipts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarships" ADD CONSTRAINT "Scholarships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaivers" ADD CONSTRAINT "FeeWaivers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaivers" ADD CONSTRAINT "FeeWaivers_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_reconciledBy_fkey" FOREIGN KEY ("reconciledBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeNotifications" ADD CONSTRAINT "FeeNotifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAuditLogs" ADD CONSTRAINT "FeeAuditLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAuditLogs" ADD CONSTRAINT "FeeAuditLogs_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAdjustments" ADD CONSTRAINT "FeeAdjustments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAdjustments" ADD CONSTRAINT "FeeAdjustments_adjustedBy_fkey" FOREIGN KEY ("adjustedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocations" ADD CONSTRAINT "PaymentAllocations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCollectionClosures" ADD CONSTRAINT "FeeCollectionClosures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCollectionClosures" ADD CONSTRAINT "FeeCollectionClosures_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCollectionCenters" ADD CONSTRAINT "FeeCollectionCenters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialPeriodsMapping" ADD CONSTRAINT "FinancialPeriodsMapping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplates" ADD CONSTRAINT "NotificationTemplates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplateVersions" ADD CONSTRAINT "NotificationTemplateVersions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplateVersions" ADD CONSTRAINT "NotificationTemplateVersions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationCampaigns" ADD CONSTRAINT "NotificationCampaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationCampaignTargets" ADD CONSTRAINT "NotificationCampaignTargets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationCampaignTargets" ADD CONSTRAINT "NotificationCampaignTargets_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationQueue" ADD CONSTRAINT "NotificationQueue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationQueue" ADD CONSTRAINT "NotificationQueue_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDeliveries" ADD CONSTRAINT "NotificationDeliveries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSubscriptions" ADD CONSTRAINT "NotificationSubscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSubscriptions" ADD CONSTRAINT "NotificationSubscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLogs" ADD CONSTRAINT "NotificationLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLogs" ADD CONSTRAINT "NotificationLogs_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsProviders" ADD CONSTRAINT "SmsProviders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailProviders" ADD CONSTRAINT "EmailProviders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappProviders" ADD CONSTRAINT "WhatsappProviders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushDevices" ADD CONSTRAINT "PushDevices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushDevices" ADD CONSTRAINT "PushDevices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotifications" ADD CONSTRAINT "PushNotifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcements" ADD CONSTRAINT "Announcements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcements" ADD CONSTRAINT "Announcements_createdByUser_fkey" FOREIGN KEY ("createdByUser") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReads" ADD CONSTRAINT "AnnouncementReads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReads" ADD CONSTRAINT "AnnouncementReads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvents" ADD CONSTRAINT "WebhookEvents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDeliveries" ADD CONSTRAINT "WebhookDeliveries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAuditLogs" ADD CONSTRAINT "CommunicationAuditLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAuditLogs" ADD CONSTRAINT "CommunicationAuditLogs_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttachments" ADD CONSTRAINT "NotificationAttachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationVariables" ADD CONSTRAINT "NotificationVariables_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRetryQueue" ADD CONSTRAINT "NotificationRetryQueue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRateLimits" ADD CONSTRAINT "CommunicationRateLimits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderFailovers" ADD CONSTRAINT "ProviderFailovers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardDefinitions" ADD CONSTRAINT "DashboardDefinitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidgets" ADD CONSTRAINT "DashboardWidgets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDefinitions" ADD CONSTRAINT "ReportDefinitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecutions" ADD CONSTRAINT "ReportExecutions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecutions" ADD CONSTRAINT "ReportExecutions_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiDefinitions" ADD CONSTRAINT "KpiDefinitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshots" ADD CONSTRAINT "KpiSnapshots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnalytics" ADD CONSTRAINT "StudentAnalytics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchAnalytics" ADD CONSTRAINT "BranchAnalytics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAnalytics" ADD CONSTRAINT "FinancialAnalytics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsRefreshJobs" ADD CONSTRAINT "AnalyticsRefreshJobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsAuditLogs" ADD CONSTRAINT "AnalyticsAuditLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsAuditLogs" ADD CONSTRAINT "AnalyticsAuditLogs_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProviders" ADD CONSTRAINT "AiProviders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiModels" ADD CONSTRAINT "AiModels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPrompts" ADD CONSTRAINT "AiPrompts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversations" ADD CONSTRAINT "AiConversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversations" ADD CONSTRAINT "AiConversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessages" ADD CONSTRAINT "AiMessages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequests" ADD CONSTRAINT "AiRequests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequests" ADD CONSTRAINT "AiRequests_triggeredByUser_fkey" FOREIGN KEY ("triggeredByUser") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedContent" ADD CONSTRAINT "AiGeneratedContent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFeedback" ADD CONSTRAINT "AiFeedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFeedback" ADD CONSTRAINT "AiFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLogs" ADD CONSTRAINT "AiUsageLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLogs" ADD CONSTRAINT "AiUsageLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAuditLogs" ADD CONSTRAINT "AiAuditLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAuditLogs" ADD CONSTRAINT "AiAuditLogs_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObjects" ADD CONSTRAINT "StorageObjects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObjects" ADD CONSTRAINT "StorageObjects_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUploads" ADD CONSTRAINT "FileUploads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobs" ADD CONSTRAINT "BackgroundJobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecutions" ADD CONSTRAINT "JobExecutions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulerJobs" ADD CONSTRAINT "SchedulerJobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulerHistory" ADD CONSTRAINT "SchedulerHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiLogs" ADD CONSTRAINT "ApiLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemHealthLogs" ADD CONSTRAINT "SystemHealthLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLogs" ADD CONSTRAINT "ErrorLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLogs" ADD CONSTRAINT "ErrorLogs_resolvedByUser_fkey" FOREIGN KEY ("resolvedByUser") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemConfigurations" ADD CONSTRAINT "SystemConfigurations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformEvents" ADD CONSTRAINT "PlatformEvents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformEvents" ADD CONSTRAINT "PlatformEvents_triggeredByUser_fkey" FOREIGN KEY ("triggeredByUser") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAuditLogs" ADD CONSTRAINT "PlatformAuditLogs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAuditLogs" ADD CONSTRAINT "PlatformAuditLogs_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuMaster" ADD CONSTRAINT "MenuMaster_menuGroupId_fkey" FOREIGN KEY ("menuGroupId") REFERENCES "MenuGroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuMaster" ADD CONSTRAINT "MenuMaster_parentMenuId_fkey" FOREIGN KEY ("parentMenuId") REFERENCES "MenuMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenuVisibility" ADD CONSTRAINT "RoleMenuVisibility_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenuVisibility" ADD CONSTRAINT "RoleMenuVisibility_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MenuMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleTemplates" ADD CONSTRAINT "RoleTemplates_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionDependencies" ADD CONSTRAINT "PermissionDependencies_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionDependencies" ADD CONSTRAINT "PermissionDependencies_requiresPermissionId_fkey" FOREIGN KEY ("requiresPermissionId") REFERENCES "Permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleInheritance" ADD CONSTRAINT "RoleInheritance_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleInheritance" ADD CONSTRAINT "RoleInheritance_inheritsRoleId_fkey" FOREIGN KEY ("inheritsRoleId") REFERENCES "Roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionConditions" ADD CONSTRAINT "PermissionConditions_rolePermissionId_fkey" FOREIGN KEY ("rolePermissionId") REFERENCES "RolePermissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_escalationStepId_fkey" FOREIGN KEY ("escalationStepId") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRequests" ADD CONSTRAINT "WorkflowRequests_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRequests" ADD CONSTRAINT "WorkflowRequests_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRequests" ADD CONSTRAINT "WorkflowRequests_status_fkey" FOREIGN KEY ("status") REFERENCES "WorkflowStates"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_fromStepId_fkey" FOREIGN KEY ("fromStepId") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_toStepId_fkey" FOREIGN KEY ("toStepId") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_actionCode_fkey" FOREIGN KEY ("actionCode") REFERENCES "WorkflowActions"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_fromStatus_fkey" FOREIGN KEY ("fromStatus") REFERENCES "WorkflowStates"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_toStatus_fkey" FOREIGN KEY ("toStatus") REFERENCES "WorkflowStates"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowComments" ADD CONSTRAINT "WorkflowComments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowComments" ADD CONSTRAINT "WorkflowComments_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowAttachments" ADD CONSTRAINT "WorkflowAttachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNotifications" ADD CONSTRAINT "WorkflowNotifications_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEscalations" ADD CONSTRAINT "WorkflowEscalations_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEscalations" ADD CONSTRAINT "WorkflowEscalations_escalatedFromStepId_fkey" FOREIGN KEY ("escalatedFromStepId") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEscalations" ADD CONSTRAINT "WorkflowEscalations_escalatedToStepId_fkey" FOREIGN KEY ("escalatedToStepId") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransitions" ADD CONSTRAINT "WorkflowTransitions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransitions" ADD CONSTRAINT "WorkflowTransitions_fromStatus_fkey" FOREIGN KEY ("fromStatus") REFERENCES "WorkflowStates"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransitions" ADD CONSTRAINT "WorkflowTransitions_toStatus_fkey" FOREIGN KEY ("toStatus") REFERENCES "WorkflowStates"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransitions" ADD CONSTRAINT "WorkflowTransitions_actionCode_fkey" FOREIGN KEY ("actionCode") REFERENCES "WorkflowActions"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNotificationDeadLetters" ADD CONSTRAINT "WorkflowNotificationDeadLetters_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowRequests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicySettings" ADD CONSTRAINT "PolicySettings_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "PolicyCategories"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "States" ADD CONSTRAINT "States_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locales" ADD CONSTRAINT "Locales_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locales" ADD CONSTRAINT "Locales_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "Countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MimeTypes" ADD CONSTRAINT "MimeTypes_fileTypeCode_fkey" FOREIGN KEY ("fileTypeCode") REFERENCES "FileTypes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountriesPhoneCodes" ADD CONSTRAINT "CountriesPhoneCodes_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
