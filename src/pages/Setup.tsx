import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'

export default function Setup(){
  const nav = useNavigate()
  const create = useApp(s => s.createHousehold)
  useRealtimeUpdates() // This handles all real-time updates
  const [family, setFamily] = useState('Family')
  const [parentUsername, setParentUsername] = useState('')
  const [parentPassword, setParentPassword] = useState('')
  const [children, setChildren] = useState([
    { name: 'Child 1', age: 11, weeklyCashCap: 15, bedSchool: '9:00 PM', bedWeekend: '11:00 PM' }
  ])

  // Helper function to convert 12-hour time to 24-hour time
  const convertTo24Hour = (time12: string) => {
    const [time, period] = time12.split(' ')
    const [hours, minutes] = time.split(':')
    let hour24 = parseInt(hours)
    if (period === 'PM' && hour24 !== 12) hour24 += 12
    if (period === 'AM' && hour24 === 12) hour24 = 0
    return `${hour24.toString().padStart(2, '0')}:${minutes}`
  }

  // Helper function to convert 24-hour time to 12-hour time
  const convertTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':')
    const hour24 = parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const period = hour24 >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${period}`
  }

  const addChild = () => {
    setChildren([...children, { 
      name: `Child ${children.length + 1}`, 
      age: 8, 
      weeklyCashCap: 10, 
      bedSchool: '9:00 PM', 
      bedWeekend: '10:00 PM' 
    }])
  }

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index))
    }
  }

  const updateChild = (index: number, field: string, value: any) => {
    setChildren(children.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    ))
  }

  const start = () => {
    if (!parentUsername || !parentPassword) {
      alert('Please enter a username and password for the parent account.')
      return
    }
    
    // Convert bedtime times to 24-hour format for storage
    const childrenWith24HourTimes = children.map(child => ({
      ...child,
      bedSchool: convertTo24Hour(child.bedSchool),
      bedWeekend: convertTo24Hour(child.bedWeekend)
    }))
    
    create(family, childrenWith24HourTimes, parentUsername, parentPassword)
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
        <div className="vstack">
          <label className="label">Family Name</label>
          <input className="input" value={family} onChange={e=>setFamily(e.target.value)} placeholder="Enter your family name" />
        </div>
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <div className="section-title">Children</div>
          </div>
          <button className="btn" onClick={addChild}>+ Add Child</button>
        </div>
        
        <div className="grid grid-2">
          {children.map((child, i) => (
            <div className="section" key={i}>
              <div className="section-header">
                <div>
                  <div className="section-title">Child {i + 1}</div>
                </div>
                {children.length > 1 && (
                  <button className="btn warn small" onClick={() => removeChild(i)}>Remove</button>
                )}
              </div>
              
              <div className="vstack">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={child.name} onChange={e=>updateChild(i, 'name', e.target.value)} placeholder="Child's name"/>
                </div>
                <div>
                  <label className="label">Age</label>
                  <input className="input" type="number" value={child.age} onChange={e=>updateChild(i, 'age', parseInt(e.target.value||'0',10))} min="1" max="18"/>
                </div>
                <div>
                  <label className="label">Weekly cash cap ($)</label>
                  <input className="input" type="number" value={child.weeklyCashCap} onChange={e=>updateChild(i, 'weeklyCashCap', parseInt(e.target.value||'0',10))} min="0" max="100"/>
                </div>
                <div className="grid grid-2">
                  <div>
                    <label className="label">School bedtime</label>
                    <input className="input" value={child.bedSchool} onChange={e=>updateChild(i, 'bedSchool', e.target.value)} placeholder="9:00 PM"/>
                  </div>
                  <div>
                    <label className="label">Weekend bedtime</label>
                    <input className="input" value={child.bedWeekend} onChange={e=>updateChild(i, 'bedWeekend', e.target.value)} placeholder="10:00 PM"/>
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
            <div className="section-title">Parent Account</div>
            <div className="section-subtitle">Create your parent login credentials</div>
          </div>
        </div>
        
        <div className="grid grid-2">
          <div className="vstack">
            <label className="label">Username</label>
            <input className="input" value={parentUsername} onChange={e=>setParentUsername(e.target.value)} placeholder="Enter username" />
          </div>
          <div className="vstack">
            <label className="label">Password</label>
            <input className="input" type="password" value={parentPassword} onChange={e=>setParentPassword(e.target.value)} placeholder="Enter password" />
          </div>
        </div>
        
        <div className="help-text">
          💡 You can invite another parent later in the settings. This account will be the primary administrator.
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
