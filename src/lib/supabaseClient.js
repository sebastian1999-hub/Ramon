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

export function renderTopNav(activePath) {
  const links = [
    { href: '/', label: 'Cronómetro' },
    { href: '/alumnos.html', label: 'Alumnos' },
  ]

  const navLinks = links
    .map((link) => {
      const isActive = activePath === link.href
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
