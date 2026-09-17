-- Teacher accounts: a student row flagged as staff that can reach every language
-- and read a roster dashboard. The same username exists in each grade so staff
-- can sign in through any grade card on the home screen.
alter table public.output_league_students
  add column if not exists is_teacher boolean not null default false;

alter table public.output_league_students
  drop constraint if exists output_league_students_username_key;

create unique index if not exists output_league_students_username_grade_key
  on public.output_league_students (username, grade);

create or replace function private.output_league_state(p_student_id uuid, p_session_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'token', p_session_token,
    'expires_at', session.expires_at,
    'student', jsonb_build_object(
      'id', student.id,
      'username', student.username,
      'full_name', student.full_name,
      'grade', student.grade,
      'class_name', student.class_name,
      'group_name', student.group_name,
      'is_teacher', student.is_teacher
    ),
    'settings', coalesce(preferences.settings, '{"sound":true,"reducedMotion":false,"paint":"azure","trail":"ion","decal":"crown","pitch":"shuffle"}'::jsonb),
    'progress', coalesce((
      select jsonb_object_agg(progress.level_id::text, jsonb_build_object(
        'best_score', progress.best_score,
        'stars', progress.stars,
        'complete', progress.complete
      ))
      from public.student_progress as progress
      where progress.student_id = student.id
        and progress.language = case student.grade when 7 then 'python' when 8 then 'swift' else 'csharp' end
    ), '{}'::jsonb)
  )
  from public.output_league_students as student
  join public.student_sessions as session
    on session.student_id = student.id
   and session.token_hash = extensions.digest(p_session_token::text, 'sha256')
   and session.expires_at > now()
  left join public.student_settings as preferences on preferences.student_id = student.id
  where student.id = p_student_id
  limit 1
$$;

create or replace function public.save_student_progress(p_session_token uuid, p_language text, p_level_id integer, p_score integer, p_stars integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  student_id uuid;
  student_grade smallint;
  student_is_teacher boolean;
  expected_language text;
begin
  student_id := private.output_league_student_id(p_session_token);
  if student_id is null or p_level_id not between 1 and 8 or p_score < 0 or p_stars not between 0 and 3 then return false; end if;
  if p_language not in ('python', 'swift', 'csharp') then return false; end if;

  select grade, is_teacher into student_grade, student_is_teacher from public.output_league_students where id = student_id;
  expected_language := case student_grade when 7 then 'python' when 8 then 'swift' else 'csharp' end;
  if student_is_teacher is not true and p_language <> expected_language then return false; end if;

  insert into public.student_progress (student_id, language, level_id, best_score, stars, complete, attempts, updated_at)
  values (student_id, p_language, p_level_id, p_score, p_stars, true, 1, now())
  on conflict (student_id, language, level_id) do update set
    best_score = greatest(public.student_progress.best_score, excluded.best_score),
    stars = greatest(public.student_progress.stars, excluded.stars),
    complete = true,
    attempts = public.student_progress.attempts + 1,
    updated_at = excluded.updated_at;
  return true;
end
$$;

create or replace function public.get_all_time_leaders()
returns table(language text, rank bigint, display_name text, total_score bigint, total_stars bigint, levels_completed bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select progress.language, progress.student_id, sum(progress.best_score)::bigint as total_score,
      sum(progress.stars)::bigint as total_stars, count(*) filter (where progress.complete)::bigint as levels_completed
    from public.student_progress as progress
    group by progress.language, progress.student_id
  ), ranked as (
    select totals.*, row_number() over (partition by totals.language order by totals.total_score desc, totals.total_stars desc, totals.student_id) as rank
    from totals
  )
  select ranked.language, ranked.rank,
    split_part(student.full_name, ' ', 1) || ' ' || left(regexp_replace(student.full_name, '^.*\s', ''), 1) || '.' as display_name,
    ranked.total_score, ranked.total_stars, ranked.levels_completed
  from ranked
  join public.output_league_students as student on student.id = ranked.student_id
  where ranked.rank <= 10 and student.is_teacher = false
  order by ranked.language, ranked.rank
$$;

create or replace function public.get_teacher_dashboard(p_session_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  caller_is_teacher boolean;
begin
  caller_id := private.output_league_student_id(p_session_token);
  if caller_id is null then return null; end if;

  select student.is_teacher into caller_is_teacher
  from public.output_league_students as student
  where student.id = caller_id;
  if caller_is_teacher is not true then return null; end if;

  return jsonb_build_object(
    'students', coalesce((
      select jsonb_agg(entry order by entry->>'class_name', entry->>'full_name')
      from (
        select jsonb_build_object(
          'id', student.id,
          'username', student.username,
          'full_name', student.full_name,
          'grade', student.grade,
          'class_name', student.class_name,
          'group_name', student.group_name,
          'progress', coalesce((
            select jsonb_object_agg(agg.language, jsonb_build_object(
              'best_score', agg.total_score,
              'stars', agg.total_stars,
              'levels_completed', agg.levels_completed
            ))
            from (
              select lang.language,
                coalesce(sum(progress.best_score), 0)::bigint as total_score,
                coalesce(sum(progress.stars), 0)::bigint as total_stars,
                count(*) filter (where progress.complete)::bigint as levels_completed
              from (values ('python'), ('swift'), ('csharp')) as lang(language)
              left join public.student_progress as progress
                on progress.student_id = student.id and progress.language = lang.language
              group by lang.language
            ) as agg
          ), '{}'::jsonb)
        ) as entry
        from public.output_league_students as student
        where student.is_teacher = false
      ) as entries
    ), '[]'::jsonb)
  );
end
$$;

revoke all on function public.get_teacher_dashboard(uuid) from public, anon, authenticated;
grant execute on function public.get_teacher_dashboard(uuid) to anon, authenticated;
