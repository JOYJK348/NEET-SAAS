-- AlterTable
ALTER TABLE "AcademicYears" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiAuditLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiConversations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiFeedback" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiGeneratedContent" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiMessages" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiModels" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiPrompts" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiProviders" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiRequests" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AiUsageLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AnalyticsAuditLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AnalyticsRefreshJobs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AnnouncementReads" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Announcements" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ApiKeys" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ApiLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AssignmentSubmissions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AttendanceRecords" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AttendanceSessions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BackgroundJobs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BatchDeliveryTypes" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Batches" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BranchAnalytics" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BranchDepartments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Branches" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BreakoutRoomParticipants" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Chapters" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CommunicationAuditLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CommunicationRateLimits" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CourseSubjects" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Courses" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DashboardDefinitions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DashboardWidgets" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Departments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Designations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmailProviders" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmergencyContacts" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ErrorLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExamAnswers" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExamAttempts" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExamDocuments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExamQuestions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExamRegistrations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExamResults" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ExamSections" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Exams" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeatureFlags" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeAdjustments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeAuditLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeCollectionCenters" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeCollectionClosures" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeDiscounts" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeInstallments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeNotifications" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeePayments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeePenalties" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeReceipts" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeStructureItems" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeStructures" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeeWaivers" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FileUploads" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FinancialAnalytics" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FinancialPeriodsMapping" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Institutes" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "JobExecutions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "KpiDefinitions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "KpiSnapshots" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LearningBookmarks" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LearningMaterials" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LearningNotes" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LearningPathMaterials" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LearningPaths" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LeaveAttachments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LeaveRequests" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassAttendance" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassBreakoutRooms" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassChatMessages" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassEvents" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassInstructors" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassParticipants" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassPollResponses" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassPolls" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassRaiseHands" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassRecordings" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassResources" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassSessions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClassWhiteboardSnapshots" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LiveClasses" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MaterialAssignments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MaterialAttachments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MaterialDiscussions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MenuGroups" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MenuMaster" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MenuPermissions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Menus" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationAttachments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationCampaignTargets" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationCampaigns" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationDeliveries" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationPreferences" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationQueue" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationRetryQueue" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationSubscriptions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationTemplateVersions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationTemplates" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NotificationVariables" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ParentProfiles" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentAllocations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentReconciliation" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentRefunds" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentTransactions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PermissionConditions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PermissionDependencies" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PermissionGroups" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Permissions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PersonIdentifiers" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PlatformAuditLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PlatformEvents" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PolicyCategories" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PolicySettings" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProviderFailovers" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PushDevices" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PushNotifications" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionAttachments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionExplanations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionImportJobs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionOptions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionPaperQuestions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionPapers" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionReviews" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionTagMappings" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionTags" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QuestionUsage" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Questions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ReportDefinitions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ReportExecutions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RoleInheritance" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RoleMenuVisibility" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RolePermissions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RoleTemplates" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Roles" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SchedulerHistory" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SchedulerJobs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Scholarships" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SmsProviders" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaffBatchAssignments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaffDepartments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaffProfiles" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaffQualifications" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaffSubjects" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StorageObjects" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentAdmissions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentAnalytics" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentBatchEnrollments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentDocuments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentFeeAssignments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentFeeDiscounts" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentFeeInstallments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentFeePenalties" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentLearningProgress" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentMedicalProfiles" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentParents" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentProfiles" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentStatusHistory" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subjects" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SystemConfigurations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SystemHealthLogs" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SystemSettings" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TenantSettings" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Topics" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserRoles" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WebhookDeliveries" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WebhookEvents" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WhatsappProviders" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowAttachments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowComments" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowDelegations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowEscalations" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowNotifications" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowRequests" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowSteps" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowTransitions" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workflows" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedBy" DROP NOT NULL;

