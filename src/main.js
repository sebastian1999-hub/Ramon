import './style.css'
import { createSupabaseClient, renderMissingConfig, renderTopNav } from './lib/supabaseClient'
import { formatElapsed } from './lib/timeUtils'

const app = document.querySelector('#app')
const supabase = createSupabaseClient()

if (!supabase) {
  renderMissingConfig(app)
} else {
  boot()
}

function boot() {
  let students = []
  let activeStudentIds = []
  let sessionStarted = false

  let running = false
  let startAt = 0
  let accumulatedMs = 0
  let rafId = null

  app.innerHTML = `
  <main class="layout">
    ${renderTopNav('/')}
    <section class="hero">
      <p class="eyebrow">Cronómetro</p>
      <h1>Registro de Vueltas</h1>
      <p>Comienza el tiempo y pulsa cada alumno cuando complete una vuelta, sin detener el cronómetro.</p>
    </section>

    <section class="panel timer-panel">
      <div class="timer-head">
        <h2>Cronómetro</h2>
        <div id="chrono" class="chrono">00:00.000</div>
      </div>

      <div class="timer-actions">
        <button id="startBtn" class="btn btn-primary" type="button">Comenzar</button>
        <button id="pauseBtn" class="btn" type="button">Pausar</button>
        <button id="resetBtn" class="btn" type="button">Reiniciar</button>
      </div>

      <p id="status" class="status">Listo para comenzar.</p>

      <div id="participantsSection">
        <h3>Participantes de esta tanda</h3>
        <p class="hint">Haz clic en un participante para quitarlo de la tanda.</p>
        <div id="selectedButtons" class="lap-grid"></div>
      </div>

      <div id="lapsSection">
        <h3>Registrar vuelta</h3>
        <p class="hint">Una vez iniciado, pulsa cada nombre para guardar su tiempo sin detener el cronómetro.</p>
        <div id="lapButtons" class="lap-grid"></div>
      </div>
    </section>

    <section id="rosterSection" class="panel">
      <h2>Listado de alumnos</h2>
      <p class="hint">Haz clic en un alumno para añadirlo a la tanda actual.</p>
      <div id="rosterButtons" class="roster-grid"></div>
    </section>
  </main>
  `

  const chronoEl = document.querySelector('#chrono')
  const statusEl = document.querySelector('#status')
  const participantsSectionEl = document.querySelector('#participantsSection')
  const lapsSectionEl = document.querySelector('#lapsSection')
  const rosterSectionEl = document.querySelector('#rosterSection')
  const selectedButtonsEl = document.querySelector('#selectedButtons')
  const rosterButtonsEl = document.querySelector('#rosterButtons')
  const lapButtonsEl = document.querySelector('#lapButtons')

  document.querySelector('#startBtn').addEventListener('click', startTimer)
  document.querySelector('#pauseBtn').addEventListener('click', pauseTimer)
  document.querySelector('#resetBtn').addEventListener('click', resetTimer)

  init()

  async function init() {
    await loadStudents()
    renderStudentActions()
    renderModeVisibility()
  }

  async function loadStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, created_at')
    .order('full_name', { ascending: true })

  if (error) {
    setStatus(`Error cargando alumnos: ${error.message}`, true)
    return
  }

  students = data ?? []
  }

  function startTimer() {
  if (activeStudentIds.length === 0) {
    setStatus('Primero añade alumnos a la tanda antes de comenzar.', true)
    return
  }
  if (running) return
  sessionStarted = true
  running = true
  startAt = performance.now() - accumulatedMs
  tick()
  renderModeVisibility()
  setStatus('Cronómetro en marcha.')
  }

  function pauseTimer() {
  if (!running) return
  running = false
  accumulatedMs = performance.now() - startAt
  if (rafId) cancelAnimationFrame(rafId)
  setStatus('Cronómetro en pausa.')
  }

  function resetTimer() {
  running = false
  sessionStarted = false
  accumulatedMs = 0
  startAt = 0
  if (rafId) cancelAnimationFrame(rafId)
  chronoEl.textContent = formatElapsed(0)
  renderModeVisibility()
  setStatus('Cronómetro reiniciado.')
  }

  function renderModeVisibility() {
    participantsSectionEl.style.display = sessionStarted ? 'none' : 'block'
    rosterSectionEl.style.display = sessionStarted ? 'none' : 'grid'
    lapsSectionEl.style.display = sessionStarted ? 'block' : 'none'
  }

  function tick() {
  if (!running) return
  accumulatedMs = performance.now() - startAt
  chronoEl.textContent = formatElapsed(accumulatedMs)
  rafId = requestAnimationFrame(tick)
  }

  async function registerLap(studentId) {
  if (!running) {
    setStatus('Inicia el cronómetro antes de registrar vueltas.', true)
    return
  }

  const student = students.find((item) => item.id === studentId)
  const elapsedMs = Math.round(accumulatedMs)

  const { error } = await supabase.from('lap_times').insert([
    {
      student_id: studentId,
      elapsed_ms: elapsedMs,
      recorded_at: new Date().toISOString(),
    },
  ])

  if (error) {
    setStatus(`No se pudo guardar la vuelta: ${error.message}`, true)
    return
  }

  setStatus(`Vuelta guardada para ${student?.full_name ?? 'alumno'} en ${formatElapsed(elapsedMs)}.`)
  }

  function addToActiveList(studentId) {
    if (running) {
      setStatus('No puedes modificar la lista mientras el cronómetro está en marcha.', true)
      return
    }
    if (activeStudentIds.includes(studentId)) return
    activeStudentIds.push(studentId)
    renderStudentActions()
  }

  function removeFromActiveList(studentId) {
    if (running) {
      setStatus('No puedes modificar la lista mientras el cronómetro está en marcha.', true)
      return
    }
    activeStudentIds = activeStudentIds.filter((id) => id !== studentId)
    renderStudentActions()
  }

  function renderStudentActions() {
    if (students.length === 0) {
      rosterButtonsEl.innerHTML = '<p class="empty">No hay alumnos cargados.</p>'
      selectedButtonsEl.innerHTML = '<p class="empty">Sin alumnos seleccionados.</p>'
      lapButtonsEl.innerHTML = '<p class="empty">No hay alumnos cargados.</p>'
      return
    }

    const activeStudents = students.filter((student) => activeStudentIds.includes(student.id))

    rosterButtonsEl.innerHTML = students
      .map((student) => {
        const inList = activeStudentIds.includes(student.id)
        return `<button class="roster-btn ${inList ? 'in-list' : ''}" type="button" data-id="${student.id}">${student.full_name}</button>`
      })
      .join('')

    selectedButtonsEl.innerHTML =
      activeStudents.length === 0
        ? '<p class="empty">Aún no seleccionaste participantes.</p>'
        : activeStudents
            .map(
              (student) => `<button class="remove-btn" type="button" data-id="${student.id}">${student.full_name}</button>`
            )
            .join('')

    lapButtonsEl.innerHTML =
      activeStudents.length === 0
        ? '<p class="empty">Selecciona alumnos para habilitar el registro de vueltas.</p>'
        : activeStudents
            .map(
              (student) => `<button class="lap-btn" type="button" data-id="${student.id}">${student.full_name}</button>`
            )
            .join('')

    rosterButtonsEl.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => addToActiveList(button.dataset.id))
    })

    selectedButtonsEl.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => removeFromActiveList(button.dataset.id))
    })

    lapButtonsEl.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => registerLap(button.dataset.id))
    })
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message
    statusEl.classList.toggle('error', isError)
  }
}
