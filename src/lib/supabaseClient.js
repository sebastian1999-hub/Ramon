import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  const runtimeEnv = window.__APP_ENV__ ?? {}
  const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = runtimeEnv.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export function renderMissingConfig(app) {
  app.innerHTML = `
    <main class="missing-config">
      <h1>Faltan variables de entorno</h1>
      <p>Configura <strong>VITE_SUPABASE_URL</strong> y <strong>VITE_SUPABASE_ANON_KEY</strong> en un archivo .env.</p>
    </main>
  `
}

export function appPath(path = '') {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedPath = path.replace(/^\/+/, '')
  return `${normalizedBase}${normalizedPath}`
}

export function renderTopNav(activePath) {
  const links = [
    { id: 'cronometro', href: appPath(''), label: 'Cronómetro' },
    { id: 'alumnos', href: appPath('alumnos.html'), label: 'Alumnos' },
  ]

  const navLinks = links
    .map((link) => {
      const isActive = activePath === link.id
      return `<a class="nav-link ${isActive ? 'active' : ''}" href="${link.href}">${link.label}</a>`
    })
    .join('')

  return `
    <header class="top-nav">
      <p class="brand">Control de Vueltas</p>
      <nav class="nav-links">${navLinks}</nav>
    </header>
  `
}
