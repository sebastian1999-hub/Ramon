import '../style.css'
import { appPath, createSupabaseClient, renderMissingConfig, renderTopNav } from '../lib/supabaseClient'
import { formatDay, formatElapsed, groupByDay } from '../lib/timeUtils'

const app = document.querySelector('#app')
const supabase = createSupabaseClient()

if (!supabase) {
  renderMissingConfig(app)
} else {
  boot()
}

async function boot() {
  const params = new URLSearchParams(window.location.search)
  const studentId = params.get('id')

  if (!studentId) {
    app.innerHTML = `
      <main class="layout">
        ${renderTopNav('alumnos')}
        <section class="panel">
          <h2>Alumno no especificado</h2>
          <p class="empty">Falta el id del alumno en la URL.</p>
          <a class="btn" href="${appPath('alumnos.html')}">Volver a alumnos</a>
        </section>
      </main>
    `
    return
  }

  const [{ data: student, error: studentError }, { data: laps, error: lapsError }] = await Promise.all([
    supabase.from('students').select('id, full_name').eq('id', studentId).maybeSingle(),
    supabase
      .from('lap_times')
      .select('id, student_id, recorded_at, elapsed_ms')
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: false }),
  ])

  app.innerHTML = `
    <main class="layout">
      ${renderTopNav('alumnos')}
      <section class="hero">
        <p class="eyebrow">Ficha del Alumno</p>
        <h1>${student?.full_name ?? 'Alumno'}</h1>
        <p>Registros de tiempos agrupados por fecha.</p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Historial</h2>
          <a class="btn" href="${appPath('alumnos.html')}">Volver a alumnos</a>
        </div>
        <div id="content"></div>
      </section>
    </main>
  `

  const contentEl = document.querySelector('#content')

  if (studentError) {
    contentEl.innerHTML = `<p class="empty">Error cargando alumno: ${studentError.message}</p>`
    return
  }

  if (!student) {
    contentEl.innerHTML = '<p class="empty">No se encontró el alumno solicitado.</p>'
    return
  }

  if (lapsError) {
    contentEl.innerHTML = `<p class="empty">Error cargando registros: ${lapsError.message}</p>`
    return
  }

  const studentLaps = laps ?? []
  if (studentLaps.length === 0) {
    contentEl.innerHTML = '<p class="empty">Este alumno aún no tiene vueltas registradas.</p>'
    return
  }

  const grouped = groupByDay(studentLaps)
  contentEl.innerHTML = Object.entries(grouped)
    .map(([day, dayLaps]) => {
      const chronologicalLaps = [...dayLaps].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      )

      const rows = chronologicalLaps
        .map((lap, index) => {
          const previousLap = index > 0 ? chronologicalLaps[index - 1] : null
          const deltaMs = previousLap ? lap.elapsed_ms - previousLap.elapsed_ms : null
          const deltaClass =
            deltaMs === null ? '' : deltaMs < 0 ? 'delta-better' : deltaMs > 0 ? 'delta-worse' : 'delta-same'
          const deltaText = deltaMs === null ? '—' : `${deltaMs < 0 ? '-' : deltaMs > 0 ? '+' : '±'}${formatElapsed(Math.abs(deltaMs))}`

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${formatElapsed(lap.elapsed_ms)}</td>
              <td class="lap-delta ${deltaClass}">${deltaText}</td>
            </tr>
          `
        })
        .join('')

      return `
        <article class="day-card">
          <h3>${formatDay(day)}</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tiempo</th>
                <th>Δ vs anterior</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </article>
      `
    })
    .join('')
}
