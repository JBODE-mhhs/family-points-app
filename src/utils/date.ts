export const toYMD = (d: Date) => d.toISOString().slice(0,10)
export const todayYMD = () => toYMD(new Date())
export const isWeekend = (d: Date) => {
  const day = d.getDay()
  return day === 5 || day === 6 // Fri or Sat
}
export const isSaturday = (d: Date) => d.getDay() === 6
export const isSunday = (d: Date) => d.getDay() === 0
export const parseTimeHHMM = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10))
  return { h, m }
}
export const nowLocalMinutes = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export const formatTime = (date: Date, timezone: string = 'America/New_York') => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date)
}

export const formatTime24 = (date: Date, timezone: string = 'America/New_York') => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}
export const hmToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
