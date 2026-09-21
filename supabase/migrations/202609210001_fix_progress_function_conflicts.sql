-- Fix runtime failures in the student write functions.
--
-- save_student_settings and save_student_progress declared a PL/pgSQL variable
-- named student_id while inserting into a column with the same name. PL/pgSQL
-- resolves that at execution time and raises SQLSTATE 42702:
--   column reference "student_id" is ambiguous
-- The browser only warns on failed RPCs, so every score and settings sync was
-- silently lost. Rename the local variables to v_student_id.

create or replace function public.save_student_settings(p_session_token uuid, p_settings jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  clean_settings jsonb;
begin
  v_student_id := private.output_league_student_id(p_session_token);
  if v_student_id is null then return false; end if;

  clean_settings := jsonb_build_object(
    'sound', case when jsonb_typeof(p_settings->'sound') = 'boolean' then (p_settings->>'sound')::boolean else true end,
    'reducedMotion', case when jsonb_typeof(p_settings->'reducedMotion') = 'boolean' then (p_settings->>'reducedMotion')::boolean else false end,
    'paint', case when p_settings->>'paint' in ('azure', 'coral', 'mint', 'violet') then p_settings->>'paint' else 'azure' end,
    'trail', case when p_settings->>'trail' in ('ion', 'solar', 'plasma') then p_settings->>'trail' else 'ion' end,
    'decal', case when p_settings->>'decal' in ('crown', 'stripes', 'bolt') then p_settings->>'decal' else 'crown' end,
    'pitch', case when p_settings->>'pitch' in ('shuffle', 'alpine', 'rain', 'ice', 'worn') then p_settings->>'pitch' else 'shuffle' end
  );

  insert into public.student_settings (student_id, settings, updated_at)
  values (v_student_id, clean_settings, now())
  on conflict (student_id) do update set settings = excluded.settings, updated_at = excluded.updated_at;
  return true;
end
$$;

create or replace function public.save_student_progress(p_session_token uuid, p_language text, p_level_id integer, p_score integer, p_stars integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  student_grade smallint;
  student_is_teacher boolean;
  expected_language text;
begin
  v_student_id := private.output_league_student_id(p_session_token);
  if v_student_id is null or p_level_id not between 1 and 8 or p_score < 0 or p_stars not between 0 and 3 then return false; end if;
  if p_language not in ('python', 'swift', 'csharp') then return false; end if;

  select grade, is_teacher into student_grade, student_is_teacher from public.output_league_students where id = v_student_id;
  expected_language := case student_grade when 7 then 'python' when 8 then 'swift' else 'csharp' end;
  if student_is_teacher is not true and p_language <> expected_language then return false; end if;

  insert into public.student_progress (student_id, language, level_id, best_score, stars, complete, attempts, updated_at)
  values (v_student_id, p_language, p_level_id, p_score, p_stars, true, 1, now())
  on conflict (student_id, language, level_id) do update set
    best_score = greatest(public.student_progress.best_score, excluded.best_score),
    stars = greatest(public.student_progress.stars, excluded.stars),
    complete = true,
    attempts = public.student_progress.attempts + 1,
    updated_at = excluded.updated_at;
  return true;
end
$$;

revoke all on function public.save_student_settings(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.save_student_progress(uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.save_student_settings(uuid, jsonb) to anon, authenticated;
grant execute on function public.save_student_progress(uuid, text, integer, integer, integer) to anon, authenticated;
