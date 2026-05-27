export function formatElapsed(ms) {
  const totalMs = Math.max(0, Math.floor(ms))
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const millis = totalMs % 1000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export function formatDay(day) {
  const date = new Date(`${day}T00:00:00`)
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function groupByDay(items) {
  return items.reduce((acc, item) => {
    const key = item.recorded_at.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}
