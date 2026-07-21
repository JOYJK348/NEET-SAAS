const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString:
      'postgresql://postgres:Jkumarjk_348@db.uhxdqlzquzblijjftmqy.supabase.co:5432/postgres',
  });

  await client.connect();

  const mappings = await client.query('SELECT * FROM "BranchCourses"');
  console.log('MAPPINGS:', mappings.rows);

  const branches = await client.query('SELECT id, name FROM "Branches"');
  console.log('BRANCHES:', branches.rows);

  const courses = await client.query('SELECT id, name FROM "Courses"');
  console.log('COURSES:', courses.rows);

  await client.end();
}

run().catch(console.error);
