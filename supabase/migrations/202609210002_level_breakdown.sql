-- Show every playable level's best score instead of only the summed total.
--
-- get_teacher_dashboard gains a per-language "levels" map with each level's
-- best score, stars, and completion. get_all_time_leaders gains a "levels" map
-- of level id to best score; its return type changes, so it is dropped and
-- recreated (grants are restored at the end).

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
              'levels_completed', agg.levels_completed,
              'levels', agg.levels
            ))
            from (
              select lang.language,
                coalesce(sum(progress.best_score), 0)::bigint as total_score,
                coalesce(sum(progress.stars), 0)::bigint as total_stars,
                count(*) filter (where progress.complete)::bigint as levels_completed,
                coalesce(jsonb_object_agg(progress.level_id::text, jsonb_build_object(
                  'best_score', progress.best_score,
                  'stars', progress.stars,
                  'complete', progress.complete
                )) filter (where progress.level_id is not null), '{}'::jsonb) as levels
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

drop function if exists public.get_all_time_leaders();

create function public.get_all_time_leaders()
returns table(language text, rank bigint, display_name text, total_score bigint, total_stars bigint, levels_completed bigint, levels jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select progress.language, progress.student_id, sum(progress.best_score)::bigint as total_score,
      sum(progress.stars)::bigint as total_stars, count(*) filter (where progress.complete)::bigint as levels_completed,
      jsonb_object_agg(progress.level_id::text, progress.best_score) as levels
    from public.student_progress as progress
    group by progress.language, progress.student_id
  ), ranked as (
    select totals.*, row_number() over (partition by totals.language order by totals.total_score desc, totals.total_stars desc, totals.student_id) as rank
    from totals
  )
  select ranked.language, ranked.rank,
    split_part(student.full_name, ' ', 1) || ' ' || left(regexp_replace(student.full_name, '^.*\s', ''), 1) || '.' as display_name,
    ranked.total_score, ranked.total_stars, ranked.levels_completed, ranked.levels
  from ranked
  join public.output_league_students as student on student.id = ranked.student_id
  where ranked.rank <= 10 and student.is_teacher = false
  order by ranked.language, ranked.rank
$$;

revoke all on function public.get_teacher_dashboard(uuid) from public, anon, authenticated;
grant execute on function public.get_teacher_dashboard(uuid) to anon, authenticated;
revoke all on function public.get_all_time_leaders() from public, anon, authenticated;
grant execute on function public.get_all_time_leaders() to anon, authenticated;
