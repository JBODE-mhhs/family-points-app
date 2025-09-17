import NavBar from '../components/NavBar'
import { useApp } from '../state/store'
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { useMemo, useState } from 'react'

export default function BankDay(){
  const app = useApp()
  const h = app.household
  useRealtimeUpdates() // This handles all real-time updates
  
  if (!h) return <div className="container"><div className="panel">No household created.</div></div>
  const s = h.settings

  const now = new Date()
  const interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }

  return (
    <div className="container">
      <NavBar/>
      <div className="panel vstack">
        <h2>Weekend Cash-Out</h2>
        <div className="small">Review the week, then cash out (50 pts = $1). Caps: configurable per child.</div>
        <div className="grid grid-2">
          {h.children.map(c => <CashCard key={c.id} childId={c.id}/>)}
        </div>
      </div>
    </div>
  )
}

function CashCard({ childId }:{ childId: string }){
  const app = useApp()
  const h = app.household!
  const s = h.settings
  const child = h.children.find(c => c.id === childId)!
  const balance = app.ledger.filter(l => l.childId === childId).reduce((a,b)=>a+b.points,0)
  const maxDollars = Math.min(Math.floor(Math.max(0, balance)/s.pointsPerDollar), child.weeklyCashCap)
  const [dollars, setDollars] = useState(maxDollars)

  return (
    <div className="card vstack">
      <h3>{child.name}</h3>
      <div className="row">
        <div>Balance: <strong>{balance} pts</strong></div>
        <div className="tag">50 pts = $1</div>
      </div>
      <label className="label">Cash out (max ${maxDollars})</label>
      <input className="input" type="number" value={dollars} onChange={e=>setDollars(Math.min(maxDollars, Math.max(0, parseInt(e.target.value||'0',10))))}/>
      <button className="btn primary" disabled={dollars<=0} onClick={()=>{
        const points = dollars * s.pointsPerDollar
        app.addSpend(childId, 'CASH_OUT', `Cash-out $${dollars}`, points)
        alert(`Cashed out $${dollars} for ${child.name} (-${points} pts).`)
      }}>Confirm cash-out</button>
    </div>
  )
}
