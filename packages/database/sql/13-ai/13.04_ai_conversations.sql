-- ============================================================================
-- SQL File: 13.04_ai_conversations.sql
-- Domain: AI Conversations threads (Chat session context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures conversational session metadata threads for AI Tutor.
-- 2. Links to a parent user who initiated the conversation.
-- 3. Enables RLS safety constraints protecting thread access logs.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    user_id UUID NOT NULL, -- References public.users.id
    
    title VARCHAR(150) NOT NULL DEFAULT 'New Conversation with AI Tutor',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_aconv_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_aconv_user FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_aconv_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_aconv_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_aconv_user ON public.ai_conversations(user_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.ai_conversations DROP CONSTRAINT IF EXISTS uq_ai_conversations_tenant_id CASCADE;
ALTER TABLE public.ai_conversations ADD CONSTRAINT uq_ai_conversations_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_conversations_touch_audit ON public.ai_conversations;
CREATE TRIGGER trg_biu_ai_conversations_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_conversations_policy ON public.ai_conversations
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
        AND (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND user_type = 'STAFF' AND deleted_at IS NULL
            )
        )
    );

CREATE POLICY insert_ai_conversations_policy ON public.ai_conversations
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id() AND user_id = auth.uid());

CREATE POLICY update_ai_conversations_policy ON public.ai_conversations
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL AND user_id = auth.uid())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_conversations_policy ON public.ai_conversations
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL AND user_id = auth.uid());
