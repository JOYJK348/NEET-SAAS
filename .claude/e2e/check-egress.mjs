// E2E helper: query LiveKit Cloud for the real state of an egress by egressId
// (independent of our DB). Confirms the egress actually started/completed on
// LiveKit's side, and prints the S3 file info if complete.
//
// Usage:
//   EGRESS_ID=<egressId> node .claude/e2e/check-egress.mjs
//   (optionally EGRESS_ID=ALL to list all recent egresses)

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');
for (const line of readFileSync(rootEnvPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const { EgressClient } = await import('livekit-server-sdk');

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const wsUrl = process.env.LIVEKIT_URL || '';
const httpUrl = wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');

const client = new EgressClient(httpUrl, apiKey, apiSecret);
const id = process.env.EGRESS_ID;

if (!id || id === 'ALL') {
  const list = await client.listEgress({ roomName: process.env.ROOM_NAME });
  console.log(JSON.stringify(list.map(e => ({ egressId: e.egressId, roomName: e.roomName, status: e.status, error: e.error })), null, 2));
} else {
  const info = await client.getEgress(id);
  const files = info.fileResults || [];
  console.log(JSON.stringify({
    egressId: info.egressId,
    roomName: info.roomName,
    status: info.status,
    error: info.error,
    startedAt: info.startedAt,
    endedAt: info.endedAt,
    files: files.map(f => ({ filename: f.filename, location: f.location, duration: f.duration, size: f.size })),
  }, null, 2));
}

process.exit(0);
