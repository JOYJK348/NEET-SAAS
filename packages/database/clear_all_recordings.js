const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const p = new PrismaClient();
const supabase = createClient(
  'https://uhxdqlzquzblijjftmqy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeGRxbHpxdXpibGlqamZ0bXF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA0MzgwOSwiZXhwIjoyMDk5NjE5ODA5fQ.slwAJ_ZTaokxS-J9rC12wTSlQmNEW8EDgefFOfcgeZs'
);

async function main() {
  const recDel = await p.liveClassRecordings.deleteMany({});
  console.log(`Deleted ${recDel.count} recording database records.`);

  const classDel = await p.liveClasses.deleteMany({});
  console.log(`Deleted ${classDel.count} live class database records.`);

  // Delete all stored files from local disk
  const uploadsDir = path.join(__dirname, '..', '..', 'apps', 'api', 'uploads', 'recordings');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(uploadsDir, file));
    }
    console.log(`Deleted ${files.length} uploaded video files from local disk.`);
  }

  // Delete all objects inside Supabase live-class-recordings bucket
  try {
    const { data: list, error: listErr } = await supabase.storage.from('live-class-recordings').list('recordings');
    if (list && list.length > 0) {
      const paths = list.map((item) => `recordings/${item.name}`);
      const { error: delErr } = await supabase.storage.from('live-class-recordings').remove(paths);
      if (delErr) {
        console.error('Supabase bucket delete err:', delErr.message);
      } else {
        console.log(`Deleted ${paths.length} objects from Supabase storage bucket.`);
      }
    } else {
      console.log('No objects found in Supabase storage bucket.');
    }
  } catch (supaErr) {
    console.error('Supabase cleanup error:', supaErr);
  }

  await p.$disconnect();
}

main().catch(console.error);
