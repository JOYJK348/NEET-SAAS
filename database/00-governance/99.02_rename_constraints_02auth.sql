-- =============================================================================
-- Constraint Rename Script — Phase 2: 02-auth
-- =============================================================================

-- 02.01 users
ALTER INDEX users_pkey RENAME TO pk_users;
ALTER TABLE public.users RENAME CONSTRAINT fk_users_auth TO fk_users_auth_users;
ALTER TABLE public.users RENAME CONSTRAINT fk_users_tenant TO fk_users_institutes;
ALTER TABLE public.users RENAME CONSTRAINT fk_users_branch_tenant TO fk_users_branches;
ALTER INDEX uq_part_users_tenant_email RENAME TO idx_uq_users_tenant_email;

-- 02.02 roles
ALTER INDEX roles_pkey RENAME TO pk_roles;
ALTER TABLE public.roles RENAME CONSTRAINT fk_roles_tenant TO fk_roles_institutes;
ALTER TABLE public.roles RENAME CONSTRAINT chk_roles_platform_tenant TO chk_roles_platform_or_tenant;
ALTER INDEX uq_part_roles_tenant_code RENAME TO idx_uq_roles_tenant_code;
ALTER INDEX uq_part_roles_global_code RENAME TO idx_uq_roles_global_code;
ALTER INDEX uq_part_roles_tenant_name_lower RENAME TO idx_uq_roles_tenant_name_lower;
ALTER INDEX uq_part_roles_global_name_lower RENAME TO idx_uq_roles_global_name_lower;

-- 02.03 permissions
ALTER INDEX permissions_pkey RENAME TO pk_permissions;
ALTER TABLE public.permissions RENAME CONSTRAINT uq_permissions_code TO uq_permissions_code;
ALTER INDEX uq_part_permissions_code RENAME TO idx_uq_permissions_code;

-- 02.04 role_permissions
ALTER INDEX role_permissions_pkey RENAME TO pk_role_permissions;
ALTER TABLE public.role_permissions RENAME CONSTRAINT fk_rp_role TO fk_role_permissions_roles;
ALTER TABLE public.role_permissions RENAME CONSTRAINT fk_rp_permission TO fk_role_permissions_permissions;
ALTER INDEX idx_rp_permission RENAME TO idx_role_permissions_permission;
ALTER INDEX idx_rp_created_by RENAME TO idx_role_permissions_created_by;

-- 02.05 user_roles
ALTER INDEX user_roles_pkey RENAME TO pk_user_roles;
ALTER TABLE public.user_roles RENAME CONSTRAINT fk_ur_user TO fk_user_roles_users;
ALTER TABLE public.user_roles RENAME CONSTRAINT fk_ur_role TO fk_user_roles_roles;
ALTER TABLE public.user_roles RENAME CONSTRAINT fk_ur_assigned_by TO fk_user_roles_users_assigned_by;
ALTER TABLE public.user_roles RENAME CONSTRAINT chk_ur_expiry TO chk_user_roles_expiry;
ALTER TABLE public.user_roles RENAME CONSTRAINT chk_ur_reason TO chk_user_roles_reason;
ALTER INDEX idx_ur_user_active RENAME TO idx_user_roles_user_active;
ALTER INDEX idx_ur_role RENAME TO idx_user_roles_role;
ALTER INDEX idx_ur_created_by RENAME TO idx_user_roles_created_by;
ALTER INDEX idx_ur_assigned_by RENAME TO idx_user_roles_assigned_by;

-- 02.06 menus
ALTER INDEX menus_pkey RENAME TO pk_menus;
ALTER TABLE public.menus RENAME CONSTRAINT fk_menus_parent TO fk_menus_menus;
ALTER TABLE public.menus RENAME CONSTRAINT uq_menus_code TO uq_menus_code;
ALTER INDEX uq_part_menus_code RENAME TO idx_uq_menus_code;

-- 02.07 menu_permissions
ALTER INDEX menu_permissions_pkey RENAME TO pk_menu_permissions;
ALTER TABLE public.menu_permissions RENAME CONSTRAINT fk_mp_menu TO fk_menu_permissions_menus;
ALTER TABLE public.menu_permissions RENAME CONSTRAINT fk_mp_permission TO fk_menu_permissions_permissions;
ALTER TABLE public.menu_permissions RENAME CONSTRAINT fk_mp_created_by TO fk_menu_permissions_users;
ALTER INDEX idx_mp_menu RENAME TO idx_menu_permissions_menu;
ALTER INDEX idx_mp_permission RENAME TO idx_menu_permissions_permission;
ALTER INDEX idx_mp_created_by RENAME TO idx_menu_permissions_created_by;

-- 02.08 user_sessions
ALTER INDEX user_sessions_pkey RENAME TO pk_user_sessions;
ALTER TABLE public.user_sessions RENAME CONSTRAINT fk_sessions_user TO fk_user_sessions_users;
ALTER TABLE public.user_sessions RENAME CONSTRAINT chk_sessions_expiry TO chk_user_sessions_expiry;
ALTER TABLE public.user_sessions RENAME CONSTRAINT chk_sessions_revocation TO chk_user_sessions_revocation;
ALTER TABLE public.user_sessions RENAME CONSTRAINT chk_sessions_logout TO chk_user_sessions_logout;
ALTER TABLE public.user_sessions RENAME CONSTRAINT chk_sessions_status_state TO chk_user_sessions_status_state;
ALTER INDEX idx_sessions_user RENAME TO idx_user_sessions_user;
ALTER INDEX idx_sessions_fingerprint RENAME TO idx_user_sessions_fingerprint;
ALTER INDEX idx_sessions_platform RENAME TO idx_user_sessions_platform;
ALTER INDEX idx_sessions_expiry RENAME TO idx_user_sessions_expiry;
ALTER INDEX uq_part_sessions_user_active_device RENAME TO idx_uq_user_sessions_user_active_device;

-- 02.09 auth_events
ALTER INDEX auth_events_pkey RENAME TO pk_auth_events;
ALTER TABLE public.auth_events RENAME CONSTRAINT fk_events_user TO fk_auth_events_users;
ALTER TABLE public.auth_events RENAME CONSTRAINT fk_events_session TO fk_auth_events_user_sessions;
