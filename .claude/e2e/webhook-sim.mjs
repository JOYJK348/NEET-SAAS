// E2E helper: deliver a faithful, LiveKit-signed `egress_ended` webhook to the
// local API, simulating LiveKit Cloud delivery (which cannot reach localhost).
//
// Usage:
//   WEBHOOK_BASE=http://localhost:3000/api/v1 \
//   EGRESS_ID=<egressId> \
//   LIVE_CLASS_ID=<id> TENANT_ID=<tid> \
//   COURSE_ID=<cid> SUBJECT_ID=<sid> CHAPTER_ID=<chid> TOPIC_ID=<tid> BATCH_ID=<bid> \
//   DURATION=<secs> SIZE=<bytes> \
//   node .claude/e2e/webhook-sim.mjs
//
// It reads LIVEKIT_API_KEY / LIVEKIT_API_SECRET / SUPABASE_STORAGE_LIVE_RECORDINGS_BUCKET
// from the repo-root .env (loaded via process.env or dotenv).

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Load .env (repo root) into process.env if not already set ───────────────
const rootEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');
for (const line of readFileSync(rootEnvPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const bucket = process.env.SUPABASE_STORAGE_LIVE_RECORDINGS_BUCKET || 'live-class-recordings';
const base = process.env.WEBHOOK_BASE || 'http://localhost:3000/api/v1';

const egressId = process.env.EGRESS_ID;
const liveClassId = process.env.LIVE_CLASS_ID;
const tenantId = process.env.TENANT_ID;
const courseId = process.env.COURSE_ID;
const subjectId = process.env.SUBJECT_ID;
const chapterId = process.env.CHAPTER_ID;
const topicId = process.env.TOPIC_ID;
const batchId = process.env.BATCH_ID;
const duration = Number(process.env.DURATION || 60);
const size = Number(process.env.SIZE || 1024 * 1024);

if (!apiKey || !apiSecret) throw new Error('LIVEKIT_API_KEY / LIVEKIT_API_SECRET missing from .env');
if (!egressId || !liveClassId || !tenantId) throw new Error('EGRESS_ID / LIVE_CLASS_ID / TENANT_ID required');

// Curriculum-nested storage object key (mirrors livekit.service.startRecording)
const objectKey =
  `tenants/${tenantId}/live_recordings/${courseId}/${subjectId}/${chapterId}/${topicId}/${batchId}/${liveClassId}.mp4`;

// `location` in LiveKit's real egress_ended payload is the S3 URL the file
// landed at. Include the bucket segment so extractObjectKey strips it.
const location = `https://uhxdqlzquzblijjftmqy.supabase.co/storage/v1/s3/${bucket}/${objectKey}`;

const payload = {
  event: 'egress_ended',
  egressInfo: {
    egressId,
    roomId: `room-${liveClassId}`,
    roomName: `room-${liveClassId}`,
    status: 'EGRESS_COMPLETE',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    fileResults: [
      {
        filename: `${bucket}/${objectKey}`,
        location,
        duration,
        size,
        egressId,
      },
    ],
  },
};

const rawBody = JSON.stringify(payload);

// Mint a LiveKit-signed webhook JWT. WebhookReceiver verifies:
//   - HS256 signature with the project apiSecret
//   - issuer === apiKey
//   - claims.sha256 === base64(sha256(rawBody))
const sha256 = createHash('sha256').update(rawBody).digest();
const shaB64 = Buffer.from(sha256).toString('base64');

// Construct HS256 JWT manually (no need to pull the SDK for a plain signed token).
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const now = Math.floor(Date.now() / 1000);
const claims = {
  iss: apiKey,
  nbf: now - 60,
  exp: now + 600,
  sha256: shaB64,
  video: { roomAdmin: true },
};
const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const body = b64url(JSON.stringify(claims));
const sigInput = `${header}.${body}`;
const { createHmac } = await import('node:crypto');
const sig = createHmac('sha256', apiSecret).update(sigInput).digest('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = `${sigInput}.${sig}`;

console.log('→ POST', `${base}/live-classes/webhook/livekit`);
console.log('  event  : egress_ended');
console.log('  egressId:', egressId);
console.log('  object :', objectKey);
console.log('  location:', location);

const res = await fetch(`${base}/live-classes/webhook/livekit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: rawBody,
});

const text = await res.text();
console.log(`← ${res.status} ${res.statusText}`);
console.log(text.slice(0, 500));
process.exit(res.ok ? 0 : 1);
