# API Key Rotation Strategy

## Lifecycle

```
Create → Active → Expiring (30d warning) → Expired → Inactive
```

## Rotation Process

1. **New key provisioned** → `encrypted_key` stored via `pgp_sym_encrypt()`
2. **Key used** → `last_used_at` updated by application layer
3. **30 days before expiry** → `v_system_health` shows `expiring_api_keys` warning
4. **Expired** → `sp_rotate_api_keys()` deactivates (sets `is_active = false`)
5. **Manual rotation** → Admin provisions new key, updates `encrypted_key`, extends `expires_at`

## Security Rules

- Keys are encrypted at rest using `pgp_sym_encrypt()` with `app.encryption_key`
- `key_prefix` stores only the first few identifying characters (e.g. `sk-live-...`)
- Decryption only via `fn_get_api_key()` (SECURITY DEFINER)
- Direct `SELECT encrypted_key` returns ciphertext only
- RLS restricts API key access to `governance.api_keys.view` permission

## Client Libraries Supported

| Service | Key Type | Rotation Auto |
|---|---|---|
| OpenAI | Bearer Token | Manual |
| Twilio | Account SID + Auth Token | Manual |
| Razorpay | Key ID + Key Secret | Manual |
| SMTP | Username + Password | Manual |
| WhatsApp | API Token | Manual |

## Scheduled Job (via external cron)

```sql
CALL sp_rotate_api_keys();       -- Daily
CALL sp_cleanup_audit_logs(365);  -- Monthly
```
