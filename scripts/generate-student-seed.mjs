import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = process.argv[2] ? resolve(process.argv[2]) : resolve('supabase/students_supabase.csv');
const destination = resolve('supabase/seed.sql');
const csv = readFileSync(source, 'utf8').replace(/^\uFEFF/, '').trim();
const [header, ...lines] = csv.split(/\r?\n/);
if (header !== 'username,full_name,grade,class_name,group_name') throw new Error(`Unexpected CSV header: ${header}`);

const quote = value => `'${value.replaceAll("'", "''")}'`;
const rows = lines.map(line => {
  const [username, fullName, grade, className, groupName = ''] = line.split(',');
  return `  (${quote(username)}, ${quote(fullName)}, ${Number(grade)}, ${quote(className)}, ${groupName ? quote(groupName) : 'null'})`;
});

const sql = `-- Generated from supabase/students_supabase.csv. Do not edit student rows here by hand.\n` +
  `insert into public.students (username, full_name, grade, class_name, group_name)\nvalues\n${rows.join(',\n')}\n` +
  `on conflict (username) do update set\n  full_name = excluded.full_name,\n  grade = excluded.grade,\n  class_name = excluded.class_name,\n  group_name = excluded.group_name;\n`;

writeFileSync(destination, sql, 'utf8');
console.log(`Wrote ${rows.length} students to ${destination}`);
