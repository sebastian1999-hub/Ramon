# Control de Vueltas (Alumnos)

Aplicacion web para registrar tiempos de vueltas de alumnos con cronometro continuo y almacenamiento en Supabase.

## Funcionalidades

- Alta de alumnos (panel de registro).
- Cronometro con botones de comenzar, pausar y reiniciar.
- Registro de vuelta por alumno sin detener el cronometro.
- Ficha por alumno con registros agrupados por fecha.
- Navegacion separada por paginas (no single page):
	- `/` cronometro y registro de vueltas
	- `/alumnos.html` panel de alumnos
	- `/alumno.html?id=<uuid>` ficha individual del alumno

## 1) Crear tablas en Supabase

Abre el SQL Editor de Supabase y ejecuta el contenido de:

- `supabase/migrations/001_students_and_lap_times.sql`

Se crearan dos tablas nuevas:

- `students`
- `lap_times`

## 2) Variables de entorno

1. Copia `.env.example` a `.env`
2. Completa tus credenciales:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 3) Ejecutar proyecto

```bash
npm install
npm run dev
```

Abre la URL local que muestra Vite (normalmente `http://localhost:5173`).

## Notas

- Los tiempos se guardan en milisegundos (`elapsed_ms`) y se muestran como `mm:ss.mmm`.
- El agrupado por dia se calcula usando `recorded_at`.
- Esta version permite operaciones con rol `anon` para prototipo. Para produccion, agrega autenticacion y politicas RLS restrictivas.
