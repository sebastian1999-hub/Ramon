import '../style.css'
import { appPath, createSupabaseClient, renderMissingConfig, renderTopNav } from '../lib/supabaseClient'

const app = document.querySelector('#app')
const supabase = createSupabaseClient()

if (!supabase) {
  renderMissingConfig(app)
} else {
  boot()
}

function boot() {
  let students = []

  app.innerHTML = `
    <main class="layout">
      ${renderTopNav('alumnos')}
      <section class="hero">
        <p class="eyebrow">Panel de Alumnos</p>
        <h1>Altas y Listado</h1>
        <p>Agrega alumnos para que aparezcan en cronómetro. Haz clic en uno para ver su historial.</p>
      </section>

      <section class="panel">
        <h2>Registrar alumno</h2>
        <form id="studentForm" class="student-form">
          <input id="studentName" type="text" placeholder="Nombre del alumno" maxlength="80" required />
          <button class="btn btn-primary" type="submit">Guardar alumno</button>
        </form>
        <p id="status" class="status">Listo.</p>
      </section>

      <section class="panel">
        <h2>Listado actual</h2>
        <ul id="studentList" class="student-list"></ul>
      </section>
    </main>
  `

  const studentFormEl = document.querySelector('#studentForm')
  const studentNameEl = document.querySelector('#studentName')
  const statusEl = document.querySelector('#status')
  const studentListEl = document.querySelector('#studentList')

  studentFormEl.addEventListener('submit', onAddStudent)
  init()

  async function init() {
    await loadStudents()
    renderStudentsList()
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

  async function onAddStudent(event) {
    event.preventDefault()
    const fullName = normalizeStudentName(studentNameEl.value)

    if (!fullName) return

    const { error } = await supabase.from('students').insert([{ full_name: fullName }])

    if (error) {
      setStatus(`No se pudo guardar el alumno: ${error.message}`, true)
      return
    }

    studentNameEl.value = ''
    await loadStudents()
    renderStudentsList()
    setStatus(`Alumno ${fullName} guardado correctamente.`)
  }

  function normalizeStudentName(value) {
    return value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const lowerWord = word.toLocaleLowerCase('es-ES')
        return lowerWord.charAt(0).toLocaleUpperCase('es-ES') + lowerWord.slice(1)
      })
      .join(' ')
  }

  async function onDeleteStudent(studentId) {
    const student = students.find((item) => item.id === studentId)
    if (!student) return

    const confirmDelete = window.confirm(`¿Eliminar a ${student.full_name}? También se borrarán sus tiempos registrados.`)
    if (!confirmDelete) return

    const { error } = await supabase.from('students').delete().eq('id', studentId)

    if (error) {
      setStatus(`No se pudo eliminar el alumno: ${error.message}`, true)
      return
    }

    await loadStudents()
    renderStudentsList()
    setStatus(`Alumno ${student.full_name} eliminado correctamente.`)
  }

  function renderStudentsList() {
    if (students.length === 0) {
      studentListEl.innerHTML = '<li class="empty">Aún no hay alumnos cargados.</li>'
      return
    }

    studentListEl.innerHTML = students
      .map(
        (student) =>
          `<li class="student-row"><a class="student-link" href="${appPath(`alumno.html?id=${student.id}`)}">${student.full_name}</a><button class="delete-btn" type="button" data-id="${student.id}">Eliminar</button></li>`
      )
      .join('')

    studentListEl.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', () => onDeleteStudent(button.dataset.id))
    })
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message
    statusEl.classList.toggle('error', isError)
  }
}
