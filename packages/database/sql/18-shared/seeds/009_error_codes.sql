-- ============================================================================
-- File       : 009_error_codes.sql
-- Module     : Shared
-- Purpose    : Seed shared error code catalogue.
-- Depends On : error_codes
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

INSERT INTO error_codes (code, module, message, detail, http_status)
VALUES
    -- Common
    ('COMMON_001', 'COMMON', 'Validation failed', 'One or more fields failed validation.', 400),
    ('COMMON_002', 'COMMON', 'Resource not found', 'The requested resource does not exist.', 404),
    ('COMMON_003', 'COMMON', 'Internal server error', 'An unexpected error occurred.', 500),
    ('COMMON_004', 'COMMON', 'Service unavailable', 'The service is temporarily unavailable.', 503),
    ('COMMON_005', 'COMMON', 'Rate limit exceeded', 'Too many requests. Please slow down.', 429),
    ('COMMON_006', 'COMMON', 'Request timeout', 'The request took too long to process.', 408),

    -- Authentication
    ('AUTH_001', 'AUTH', 'Invalid credentials', 'Email or password is incorrect.', 401),
    ('AUTH_002', 'AUTH', 'Account locked', 'Account is locked due to too many failed attempts.', 423),
    ('AUTH_003', 'AUTH', 'Session expired', 'Your session has expired. Please log in again.', 401),
    ('AUTH_004', 'AUTH', 'Invalid token', 'The provided token is invalid or malformed.', 401),
    ('AUTH_005', 'AUTH', 'Token expired', 'The provided token has expired.', 401),
    ('AUTH_006', 'AUTH', 'OTP expired', 'The OTP has expired. Request a new one.', 400),
    ('AUTH_007', 'AUTH', 'OTP invalid', 'The OTP provided is incorrect.', 400),
    ('AUTH_008', 'AUTH', 'MFA required', 'Multi-factor authentication is required.', 401),
    ('AUTH_009', 'AUTH', 'Account deactivated', 'Your account has been deactivated.', 403),

    -- User
    ('USER_001', 'USER', 'User not found', 'No user matches the provided identifier.', 404),
    ('USER_002', 'USER', 'Email already exists', 'A user with this email already exists.', 409),
    ('USER_003', 'USER', 'Phone already exists', 'A user with this phone number already exists.', 409),
    ('USER_004', 'USER', 'Invalid role', 'The specified role is invalid or not assignable.', 400),
    ('USER_005', 'USER', 'User not active', 'The user account is not active.', 403),

    -- Authorization
    ('AUTHZ_001', 'AUTHZ', 'Access denied', 'You do not have permission to perform this action.', 403),
    ('AUTHZ_002', 'AUTHZ', 'Insufficient privileges', 'Your role does not have sufficient privileges.', 403),
    ('AUTHZ_003', 'AUTHZ', 'Tenant mismatch', 'Resource does not belong to your tenant scope.', 403),

    -- Exam
    ('EXAM_001', 'EXAM', 'Exam not found', 'The specified exam does not exist.', 404),
    ('EXAM_002', 'EXAM', 'Exam not published', 'The exam is not yet published.', 400),
    ('EXAM_003', 'EXAM', 'Exam already submitted', 'You have already submitted this exam.', 409),
    ('EXAM_004', 'EXAM', 'Exam time expired', 'The exam duration has expired.', 400),
    ('EXAM_005', 'EXAM', 'Max attempts exceeded', 'You have reached the maximum attempts for this exam.', 400),

    -- Fees
    ('FEE_001', 'FEE', 'Payment failed', 'The payment transaction failed.', 400),
    ('FEE_002', 'FEE', 'Invoice not found', 'The specified invoice does not exist.', 404),
    ('FEE_003', 'FEE', 'Payment already processed', 'This payment has already been processed.', 409),
    ('FEE_004', 'FEE', 'Insufficient balance', 'Insufficient wallet balance for this transaction.', 400),
    ('FEE_005', 'FEE', 'Refund not eligible', 'This transaction is not eligible for refund.', 400),

    -- Workflow
    ('WF_001', 'WORKFLOW', 'Invalid transition', 'The requested state transition is not allowed.', 400),
    ('WF_002', 'WORKFLOW', 'Action not permitted', 'You do not have permission for this workflow action.', 403),
    ('WF_003', 'WORKFLOW', 'Workflow not found', 'The specified workflow does not exist.', 404),
    ('WF_004', 'WORKFLOW', 'Comment required', 'This action requires a comment.', 400),

    -- File
    ('FILE_001', 'FILE', 'File too large', 'The uploaded file exceeds the maximum allowed size.', 413),
    ('FILE_002', 'FILE', 'Invalid file type', 'The file type is not supported.', 415),
    ('FILE_003', 'FILE', 'File upload failed', 'The file upload failed. Please try again.', 500),
    ('FILE_004', 'FILE', 'File not found', 'The requested file does not exist.', 404),

    -- API
    ('API_001', 'API', 'Invalid API key', 'The provided API key is invalid or expired.', 401),
    ('API_002', 'API', 'Feature not available', 'This feature is not available on your current plan.', 403),
    ('API_003', 'API', 'Maintenance mode', 'The platform is currently under maintenance.', 503)
ON CONFLICT (code) DO NOTHING;
