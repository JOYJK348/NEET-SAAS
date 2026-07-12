# Storage Abstraction Contract

## Storage Provider Abstraction

All file storage is abstracted via the `storage_providers` reference table. Application code should never directly reference a cloud provider's SDK.

```mermaid
Application
  │
  ├── StorageService.upload(file, provider_code)
  ├── StorageService.download(path)
  └── StorageService.delete(path)
       │
       └── storage_providers config
            ├── Cloudflare R2
            ├── AWS S3
            ├── Supabase Storage
            ├── Azure Blob
            └── Google Cloud Storage
```

## File Storage Contract

Every stored file follows this contract:

| Field | Type | Description |
|---|---|---|
| `provider` | String | Storage provider code (e.g. `cloudflare_r2`) |
| `bucket` | String | Storage bucket/container name |
| `path` | String | Full path including filename |
| `visibility` | Enum | `PUBLIC` or `PRIVATE` |
| `checksum` | String | SHA-256 checksum of file content |
| `retention_days` | Int | Retention period in days (null = indefinite) |
| `mime_type` | String | IANA MIME type |
| `size` | BigInt | File size in bytes |

## Configuration Schema

Each storage provider has a `config_schema` JSON Schema defining required fields:

```json
{
  "type": "object",
  "properties": {
    "bucket": {"type": "string"},
    "access_key_id": {"type": "string"},
    "secret_access_key": {"type": "string"}
  },
  "required": ["bucket", "access_key_id", "secret_access_key"]
}
```

Actual credentials are stored encrypted in `governance.api_keys`.

## URL Generation

Public files:
```
{public_url}/{bucket}/{path}
```

Private files:
```
/api/storage/{provider}/{bucket}/{path}?token={signed_token}
```

## File Validation Flow

```
Upload Request
  │
  ├── 1. Validate MIME type (fn_validate_mime)
  ├── 2. Validate file type (fn_validate_file_type)
  ├── 3. Check file size against file_type.max_size_bytes
  ├── 4. Upload to storage provider
  └── 5. Record metadata in application (attachments table)
```
