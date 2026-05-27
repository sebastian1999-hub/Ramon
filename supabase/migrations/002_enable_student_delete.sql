-- Habilita borrado de alumnos para anon/authenticated en el prototipo.
-- Tambien agrega policy de delete en lap_times por si se usa borrado directo.

grant delete on table public.students to anon, authenticated;
grant delete on table public.lap_times to anon, authenticated;

drop policy if exists "students_delete" on public.students;
create policy "students_delete"
  on public.students
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "lap_times_delete" on public.lap_times;
create policy "lap_times_delete"
  on public.lap_times
  for delete
  to anon, authenticated
  using (true);
