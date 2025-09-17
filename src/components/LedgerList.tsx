import { useApp } from '../state/store'
import { LedgerEntry } from '../types'

export default function LedgerList({ entries }:{ entries: LedgerEntry[] }){
  const remove = useApp(s => s.removeLedger)
  return (
    <div className="card">
      <h3>Today’s Ledger</h3>
      <table>
        <thead>
          <tr><th>Time</th><th>Child</th><th>Type</th><th>Label</th><th>Points</th><th></th></tr>
        </thead>
        <tbody>
          {entries.slice().sort((a,b)=>b.ts-a.ts).map(e => (
            <tr key={e.id}>
              <td>{new Date(e.ts).toLocaleTimeString()}</td>
              <td>{/* child name resolved by parent */}</td>
              <td><span className="badge">{e.type}</span></td>
              <td>{e.label}</td>
              <td style={{color: e.points>=0? 'var(--good)':'var(--bad)'}}>{e.points>=0? '+' : ''}{e.points}</td>
              <td><button className="btn ghost" onClick={() => remove(e.id)}>Undo</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
