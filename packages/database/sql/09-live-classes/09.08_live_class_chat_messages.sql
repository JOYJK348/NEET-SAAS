-- ============================================================================
-- SQL File: 09.08_live_class_chat_messages.sql
-- Domain: Session Chat Messages Thread Logs (Timeline Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures all messages sent in a specific session chat channel.
-- 2. Supports threaded discussions via nullable reply_to_message_id mapping self-reference.
-- 3. Stores attachments, pins, reactions count, and edit states.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- 5. Leverages RLS safety to ensure tenant isolation.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_chat_messages (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    
    -- Thread hierarchy
    reply_to_message_id UUID NULL,
    
    -- Sender Details
    sender_id UUID NOT NULL, -- References public.users.id
    sender_role participant_role_enum NOT NULL DEFAULT 'GUEST',
    
    -- Payload
    message_type chat_message_type_enum NOT NULL DEFAULT 'TEXT',
    message TEXT NOT NULL,
    attachment_id VARCHAR(250) NULL,
    
    -- Interaction status
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    
    reaction_count JSONB NULL, -- e.g. {"like": 4, "heart": 2}
    
    edited_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcchat_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcchat_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcchat_reply FOREIGN KEY (reply_to_message_id)
        REFERENCES public.live_class_chat_messages(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_lcchat_sender FOREIGN KEY (sender_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_lcchat_message_length CHECK (length(trim(message)) > 0),
    CONSTRAINT chk_lcchat_edit_audit CHECK (
        (is_edited = false AND edited_at IS NULL)
        OR (is_edited = true AND edited_at IS NOT NULL)
    ),
    CONSTRAINT chk_lcchat_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcchat_session ON public.live_class_chat_messages(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcchat_reply ON public.live_class_chat_messages(reply_to_message_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcchat_sender ON public.live_class_chat_messages(sender_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_chat_messages_touch_audit ON public.live_class_chat_messages;
CREATE TRIGGER trg_biu_live_class_chat_messages_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_chat_messages_policy ON public.live_class_chat_messages
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_chat_messages_policy ON public.live_class_chat_messages
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_chat_messages_policy ON public.live_class_chat_messages
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_chat_messages_policy ON public.live_class_chat_messages
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
