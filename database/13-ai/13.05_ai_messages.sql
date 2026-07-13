-- ============================================================================
-- SQL File: 13.05_ai_messages.sql
-- Domain: AI chat messages history logs (Chat session context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs conversation messages exchange telemetry (system, user, assistant).
-- 2. Traces token usage metrics and response generation time directly.
-- 3. Enables clean RLS restrictions matching parent conversation owner keys.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    ai_conversation_id UUID NOT NULL,
    
    -- Content details
    role chat_message_role_enum NOT NULL DEFAULT 'USER',
    content TEXT NOT NULL,
    
    -- Telemetry metrics
    tokens_consumed INTEGER NULL,
    response_time_ms INTEGER NULL,
    
    -- Optional content link if message generated cacheable study plans/question cards
    ai_generated_content_id UUID NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_amsg_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_amsg_conversation FOREIGN KEY (tenant_id, ai_conversation_id)
        REFERENCES public.ai_conversations(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_amsg_content CHECK (length(trim(content)) > 0),
    CONSTRAINT chk_amsg_tokens CHECK (tokens_consumed IS NULL OR tokens_consumed >= 0),
    CONSTRAINT chk_amsg_response CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
    CONSTRAINT chk_amsg_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_amsg_conversation ON public.ai_messages(ai_conversation_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.ai_messages DROP CONSTRAINT IF EXISTS uq_ai_messages_tenant_id CASCADE;
ALTER TABLE public.ai_messages ADD CONSTRAINT uq_ai_messages_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_messages_touch_audit ON public.ai_messages;
CREATE TRIGGER trg_biu_ai_messages_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_messages_policy ON public.ai_messages
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
        AND (
            ai_conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND user_type = 'STAFF' AND deleted_at IS NULL
            )
        )
    );

CREATE POLICY insert_ai_messages_policy ON public.ai_messages
    FOR INSERT
    WITH CHECK (
        tenant_id = current_tenant_id()
        AND ai_conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
    );

CREATE POLICY update_ai_messages_policy ON public.ai_messages
    FOR UPDATE
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
        AND ai_conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
    )
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_messages_policy ON public.ai_messages
    FOR DELETE
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
        AND ai_conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
    );
