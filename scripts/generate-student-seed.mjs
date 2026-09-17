import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = process.argv[2] ? resolve(process.argv[2]) : resolve('supabase/students_supabase.csv');
const destination = resolve('supabase/seed.sql');
const csv = readFileSync(source, 'utf8').replace(/^\uFEFF/, '').trim();
const [header, ...lines] = csv.split(/\r?\n/);
if (header !== 'username,full_name,grade,class_name,group_name') throw new Error(`Unexpected CSV header: ${header}`);

// Staff accounts are repeated in every grade so they can sign in through any
// grade card, then reach all languages and the teacher dashboard.
const teachers = [
  ['leleomaker', 'Leo Maker'],
  ['davimaker', 'Davi Maker'],
  ['brianmaker', 'Brian Maker'],
];
const teacherRows = teachers.flatMap(([username, fullName]) => [7, 8, 9].map(grade => ({
  username, fullName, grade, className: 'STAFF', groupName: null, teacher: true,
})));

const quote = value => `'${value.replaceAll("'", "''")}'`;
const rows = lines.map(line => {
  const [username, fullName, grade, className, groupName = ''] = line.split(',');
  return { username, fullName, grade: Number(grade), className, groupName: groupName || null, teacher: false };
}).concat(teacherRows);

const values = rows.map(row => `  (${quote(row.username)}, ${quote(row.fullName)}, ${row.grade}, ${quote(row.className)}, ${row.groupName ? quote(row.groupName) : 'null'}, ${row.teacher})`);

const sql = `-- Generated from supabase/students_supabase.csv. Do not edit student rows here by hand.\n` +
  `insert into public.output_league_students (username, full_name, grade, class_name, group_name, is_teacher)\nvalues\n${values.join(',\n')}\n` +
  `on conflict (username, grade) do update set\n  full_name = excluded.full_name,\n  class_name = excluded.class_name,\n  group_name = excluded.group_name,\n  is_teacher = excluded.is_teacher;\n`;

writeFileSync(destination, sql, 'utf8');
console.log(`Wrote ${rows.length} accounts (${teacherRows.length} staff rows) to ${destination}`);
