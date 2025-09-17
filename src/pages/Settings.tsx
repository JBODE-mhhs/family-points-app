import { useState } from 'react'
import { useApp } from '../state/store'
import { formatTime } from '../utils/date'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { DashboardCard } from '../components/ui/dashboard-card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function Settings(){
  const app = useApp()
  const h = app.household
  useRealtimeUpdates()
  
  if (!h) return (
    <div className="p-6">
      <Card>
        <CardContent className="p-6">
          <p>No household created.</p>
        </CardContent>
      </Card>
    </div>
  )
  
  const s = h.settings
  
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState(() => {
    try {
      const initial = {
        ...s,
        timezone: s.timezone || 'America/New_York',
        autoBalanceEnabled: s.autoBalanceEnabled || false
      }
      return initial
    } catch (error) {
      console.error('Error initializing tempSettings:', error)
      return {
        ...s,
        timezone: 'America/New_York',
        autoBalanceEnabled: false
      }
    }
  })

  const update = (patch: Partial<typeof s>) => {
    setTempSettings(prev => ({ ...prev, ...patch }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    app.updateSettings(() => tempSettings)
    setHasChanges(false)
    alert('Settings saved!')
  }

  const resetChildPoints = (childId: string) => {
    if (confirm('Are you sure you want to reset this child\'s points to 0?')) {
      app.addEarn(childId, 'MANUAL_RESET', 'Points reset by parent', -app.ledger.filter(l => l.childId === childId).reduce((a, b) => a + b.points, 0))
      alert('Points reset!')
    }
  }

  const addPoints = (childId: string, points: number) => {
    if (points !== 0) {
      app.addEarn(childId, 'MANUAL_ADJUSTMENT', `Manual adjustment by parent (${points > 0 ? '+' : ''}${points})`, points)
      alert(`Added ${points} points!`)
    }
  }

  const resetTodayTasks = (childId?: string) => {
    const childName = childId ? h.children.find(c => c.id === childId)?.name : 'all children'
    if (confirm(`Are you sure you want to reset all completed tasks for ${childName} today? This will allow them to complete the tasks again.`)) {
      app.resetTodayTasks(childId)
      alert(`Tasks reset for ${childName}!`)
    }
  }

  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="h-8 w-8 mr-3 text-primary-500" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure your family's point system</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="text-sm">
            {h.children.length} children
          </Badge>
          <Button 
            variant={hasChanges ? "default" : "outline"}
            onClick={saveSettings}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Button>
        </div>
      </div>

      {/* System Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Point System"
          description="Configure how points work"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Block minutes</label>
              <Input
                type="number"
                value={tempSettings.blockMinutes}
                onChange={(e) => update({blockMinutes: parseInt(e.target.value || '0', 10)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Points per dollar</label>
              <Input
                type="number"
                value={tempSettings.pointsPerDollar}
                onChange={(e) => update({pointsPerDollar: parseInt(e.target.value || '0', 10)})}
              />
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Conversion Rate</div>
                <div className="text-2xl font-bold text-blue-600">{tempSettings.pointsPerDollar}p = $1</div>
                <div className="text-xs text-blue-600">50 points = $1.00</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team bonus points</label>
              <Input
                type="number"
                value={tempSettings.teamBonusPoints}
                onChange={(e) => update({teamBonusPoints: parseInt(e.target.value || '0', 10)})}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Screen Time Limits"
          description="Set daily screen time caps"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School-day cap (minutes)</label>
              <Input
                type="number"
                value={tempSettings.schooldayCapMinutes}
                onChange={(e) => update({schooldayCapMinutes: parseInt(e.target.value || '0', 10)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weekend cap (minutes)</label>
              <Input
                type="number"
                value={tempSettings.weekendCapMinutes}
                onChange={(e) => update({weekendCapMinutes: parseInt(e.target.value || '0', 10)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No-screen buffer (minutes)</label>
              <Input
                type="number"
                value={tempSettings.noScreenBufferMinutes}
                onChange={(e) => update({noScreenBufferMinutes: parseInt(e.target.value || '0', 10)})}
              />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="System Settings"
          description="Timezone and automation"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <Select
                value={tempSettings.timezone}
                onChange={(e) => update({timezone: e.target.value})}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto-balance Points</label>
              <div className="flex items-center space-x-3">
                <Button 
                  variant={tempSettings.autoBalanceEnabled ? "default" : "outline"}
                  onClick={() => update({autoBalanceEnabled: !tempSettings.autoBalanceEnabled})}
                >
                  {tempSettings.autoBalanceEnabled ? 'Enabled' : 'Disabled'}
                </Button>
                <Button 
                  variant="warning"
                  onClick={() => {
                    app.autoBalancePoints()
                    alert('Points have been auto-balanced!')
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Now
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Auto-balance helps keep children's points fair by making small adjustments toward the average.
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Current Time"
          description="System time information"
        >
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-primary-500 mb-4" />
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(new Date(), tempSettings.timezone)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {tempSettings.timezone}
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Children Management */}
      <DashboardCard
        title="👨‍👩‍👧‍👦 Children Management"
        description="Manage children's settings and points"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {h.children.map(c => {
            const currentPoints = app.ledger.filter(l => l.childId === c.id).reduce((a, b) => a + b.points, 0)
            return (
              <Card key={c.id} className="border-l-4 border-l-primary-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{c.name}</CardTitle>
                      <CardDescription>Current points: {currentPoints}</CardDescription>
                    </div>
                    <Badge variant="secondary">Level {c.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weekly cash cap ($)</label>
                    <Input
                      type="number"
                      value={c.weeklyCashCap}
                      onChange={(e) => app.updateChild(c.id, cur => ({...cur, weeklyCashCap: parseInt(e.target.value || '0', 10)}))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">School bedtime</label>
                      <Input
                        type="time"
                        value={c.bedtimes.school}
                        onChange={(e) => app.updateChild(c.id, cur => ({...cur, bedtimes: {...cur.bedtimes, school: e.target.value}}))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weekend bedtime</label>
                      <Input
                        type="time"
                        value={c.bedtimes.weekend}
                        onChange={(e) => app.updateChild(c.id, cur => ({...cur, bedtimes: {...cur.bedtimes, weekend: e.target.value}}))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points Management</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="warning" 
                        size="sm"
                        onClick={() => resetChildPoints(c.id)}
                      >
                        Reset to 0
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => addPoints(c.id, 10)}
                      >
                        +10
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => addPoints(c.id, 50)}
                      >
                        +50
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => addPoints(c.id, -10)}
                      >
                        -10
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Management</label>
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => resetTodayTasks(c.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Today's Tasks
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      Clears all completed tasks for today, allowing child to complete them again
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Child Portal Access</label>
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => {
                          const inviteCode = app.generateInviteCode(c.id)
                          navigator.clipboard.writeText(`${window.location.origin}/child/${c.id}?invite=${inviteCode}`)
                          alert(`Invite link copied! Share this with ${c.name} to give them access to their portal.`)
                        }}
                      >
                        Generate Invite Link
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          window.open(`/child/${c.id}`, '_blank')
                        }}
                      >
                        Open Child Portal
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Generate an invite link to share with {c.name} so they can access their own portal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DashboardCard>

      {/* Global Reset */}
      <DashboardCard
        title="🔄 Global Reset"
        description="Reset tasks for all children at once"
        className="border-l-4 border-l-warning-500 bg-warning-50"
      >
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Parent Only:</strong> This will reset all completed tasks for all children today, allowing them to complete tasks again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button 
            variant="warning"
            onClick={() => resetTodayTasks()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All Tasks for Today
          </Button>
        </div>
      </DashboardCard>

      {/* Task Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Baseline Tasks"
          description="Daily required tasks"
        >
          <TaskEditor list={s.baselineTasks} onChange={(list)=>update({baselineTasks:list})}/>
        </DashboardCard>

        <DashboardCard
          title="Extra Tasks"
          description="Optional bonus tasks"
        >
          <TaskEditor list={s.extraTasks} onChange={(list)=>update({extraTasks:list})}/>
        </DashboardCard>
      </div>
    </div>
  )
}

function NumberField({label, value, onChange}:{label:string; value:number; onChange:(v:number)=>void}){
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Input type="number" value={value} onChange={e=>onChange(parseInt(e.target.value||'0', 10))}/>
    </div>
  )
}

function TextField({label, value, onChange}:{label:string; value:string; onChange:(v:string)=>void}){
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Input value={value} onChange={e=>onChange(e.target.value)}/>
    </div>
  )
}

import { TaskDef, TaskCategory } from '../types'
import { v4 as uuid } from 'uuid'

function TaskEditor({ list, onChange }:{ list: TaskDef[]; onChange:(l:TaskDef[])=>void }){
  const [newTask, setNewTask] = useState({ label: '', points: 5, category: 'extra' as TaskCategory })
  
  const update = (id:string, patch: Partial<TaskDef>) => onChange(list.map(t => t.id===id? {...t, ...patch } : t))
  
  const add = () => {
    if (!newTask.label.trim()) return
    const code = newTask.label.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    onChange(list.concat([{ 
      id: uuid(), 
      code: code, 
      label: newTask.label, 
      points: newTask.points, 
      category: newTask.category 
    }]))
    setNewTask({ label: '', points: 5, category: 'extra' })
  }
  
  const remove = (id:string) => onChange(list.filter(t=>t.id!==id))
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Task</CardTitle>
          <CardDescription>Create a new task for your family</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
              <Input 
                value={newTask.label} 
                onChange={e=>setNewTask({...newTask, label: e.target.value})}
                placeholder="e.g., Take out trash"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
              <Input 
                type="number"
                value={newTask.points} 
                onChange={e=>setNewTask({...newTask, points: parseInt(e.target.value||'0',10)})}
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <Select
                value={newTask.category} 
                onChange={e=>setNewTask({...newTask, category: e.target.value as TaskCategory})}
              >
                <option value="baseline">Daily Task</option>
                <option value="extra">Extra Task</option>
              </Select>
            </div>
          </div>
          
          <Button onClick={add} disabled={!newTask.label.trim()}>
            Add Task
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Tasks</CardTitle>
          <CardDescription>Manage existing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {list.map(t => (
              <Card key={t.id} className="border-l-4 border-l-primary-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                      <Input 
                        value={t.label} 
                        onChange={e=>update(t.id, {label:e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                      <Input 
                        type="number"
                        value={t.points} 
                        onChange={e=>update(t.id, {points:parseInt(e.target.value||'0',10)})}
                        min="1"
                        max="100"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="destructive" 
                        onClick={()=>remove(t.id)}
                        className="w-full"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {list.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks created yet. Add one above!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
