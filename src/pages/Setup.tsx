import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'

export default function Setup(){
  const nav = useNavigate()
  const create = useApp(s => s.createHousehold)
  useRealtimeUpdates() // This handles all real-time updates
  const [family, setFamily] = useState('Family')
  const [kid1, setKid1] = useState({ name: 'Older Kid', age: 11, weeklyCashCap: 15, bedSchool: '21:00', bedWeekend: '23:00' })
  const [kid2, setKid2] = useState({ name: 'Younger Kid', age: 7, weeklyCashCap: 10, bedSchool: '21:00', bedWeekend: '22:00' })

  const start = () => {
    create(family, [kid1, kid2])
    nav('/parent')
  }

  return (
    <div className="container">
      <div className="panel">
        <div className="section-header">
          <div>
            <h1>Welcome to Family Points! 👋</h1>
            <div className="section-subtitle">Set up your family's point system</div>
          </div>
        </div>
        
        <div className="notice">
          <strong>Default Settings:</strong> School days 2h cap, weekends 5h/day cap, 30m buffer before bed, 1 point = 1 minute, 50 points = $1. You can customize everything later in settings.
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <div className="section-title">Family Information</div>
            <div className="section-subtitle">Basic household details</div>
          </div>
        </div>
        
        <div className="grid grid-2">
          <div className="vstack">
            <label className="label">Family Name</label>
            <input className="input" value={family} onChange={e=>setFamily(e.target.value)} placeholder="Enter your family name" />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <div className="section-title">Children</div>
            <div className="section-subtitle">Add your children to the system</div>
          </div>
        </div>
        
        <div className="grid grid-2">
          {[{state:kid1,set:setKid1,title:'Child A (11yo default)'},{state:kid2,set:setKid2,title:'Child B (7yo default)'}].map((row,i)=> (
            <div className="section" key={i}>
              <div className="section-header">
                <div>
                  <div className="section-title">{row.title}</div>
                </div>
              </div>
              
              <div className="vstack">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={row.state.name} onChange={e=>row.set({...row.state, name:e.target.value})} placeholder="Child's name"/>
                </div>
                <div>
                  <label className="label">Age</label>
                  <input className="input" type="number" value={row.state.age} onChange={e=>row.set({...row.state, age:parseInt(e.target.value||'0',10)})} min="1" max="18"/>
                </div>
                <div>
                  <label className="label">Weekly cash cap ($)</label>
                  <input className="input" type="number" value={row.state.weeklyCashCap} onChange={e=>row.set({...row.state, weeklyCashCap:parseInt(e.target.value||'0',10)})} min="0" max="100"/>
                </div>
                <div className="grid grid-2">
                  <div>
                    <label className="label">School bedtime</label>
                    <input className="input" value={row.state.bedSchool} onChange={e=>row.set({...row.state, bedSchool:e.target.value})} placeholder="21:00"/>
                  </div>
                  <div>
                    <label className="label">Weekend bedtime</label>
                    <input className="input" value={row.state.bedWeekend} onChange={e=>row.set({...row.state, bedWeekend:e.target.value})} placeholder="22:00"/>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <div className="section-title">Ready to Start?</div>
            <div className="section-subtitle">Create your household and begin tracking points</div>
          </div>
          <button className="btn primary" onClick={start}>Create Household</button>
        </div>
      </div>
    </div>
  )
}
