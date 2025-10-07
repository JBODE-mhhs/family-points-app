import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../state/store'
import { formatTime } from '../utils/date'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { staggerContainer, staggerItem } from '../theme/motion'
import { TaskDef, TaskCategory, TaskDifficulty } from '../types'
import { v4 as uuid } from 'uuid'
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  GripVertical,
  Target,
  Plus,
  Trash2
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
  const [showAddChildDialog, setShowAddChildDialog] = useState(false)
  const [tempSettings, setTempSettings] = useState(() => {
    try {
      // Deduplicate tasks by ID on initial load
      const deduplicateById = <T extends { id: string }>(arr: T[]): T[] =>
        Array.from(new Map(arr.map(item => [item.id, item])).values())

      const initial = {
        ...s,
        timezone: s.timezone || 'America/New_York',
        autoBalanceEnabled: s.autoBalanceEnabled || false,
        autoResetEnabled: s.autoResetEnabled || false,
        autoResetTime: s.autoResetTime || '00:00',
        baselineTasks: deduplicateById(s.baselineTasks),
        extraTasks: deduplicateById(s.extraTasks)
      }
      return initial
    } catch (error) {
      console.error('Error initializing tempSettings:', error)
      return {
        ...s,
        timezone: 'America/New_York',
        autoBalanceEnabled: false,
        autoResetEnabled: false,
        autoResetTime: '00:00'
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

  const cleanupOrphanedTasks = () => {
    if (!confirm('This will remove all tasks that belong to deleted children. Continue?')) return

    const validChildIds = h.children.map(c => c.id)
    const cleanedBaseline = tempSettings.baselineTasks.filter(t => !t.childId || validChildIds.includes(t.childId))
    const cleanedExtra = tempSettings.extraTasks.filter(t => !t.childId || validChildIds.includes(t.childId))

    const removedCount = (tempSettings.baselineTasks.length - cleanedBaseline.length) + (tempSettings.extraTasks.length - cleanedExtra.length)

    update({ baselineTasks: cleanedBaseline, extraTasks: cleanedExtra })
    alert(`Cleaned up ${removedCount} orphaned tasks. Click Save Settings to apply.`)
  }

  const deduplicateTasks = () => {
    const deduplicateById = <T extends { id: string }>(arr: T[]): T[] =>
      Array.from(new Map(arr.map(item => [item.id, item])).values())

    const beforeCount = tempSettings.baselineTasks.length + tempSettings.extraTasks.length
    const deduplicatedBaseline = deduplicateById(tempSettings.baselineTasks)
    const deduplicatedExtra = deduplicateById(tempSettings.extraTasks)
    const afterCount = deduplicatedBaseline.length + deduplicatedExtra.length

    update({ baselineTasks: deduplicatedBaseline, extraTasks: deduplicatedExtra })
    alert(`Removed ${beforeCount - afterCount} duplicate tasks. Click Save Settings to apply.`)
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
    <motion.div
      className="space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header - Apple Style */}
      <motion.div variants={staggerItem}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 border-2 border-primary-200 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-300/20 to-transparent rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-elevation-3"
                  whileHover={{ rotate: 180, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <SettingsIcon className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    Settings
                  </h1>
                  <p className="text-neutral-600 mt-1">Configure your family's point system</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" size="lg">
                  <Users className="h-3 w-3 mr-1" />
                  {h.children.length} {h.children.length === 1 ? 'child' : 'children'}
                </Badge>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 border border-secondary-200">
                  <Clock className="h-4 w-4 text-secondary-500" />
                  <span className="text-lg font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                    {formatTime(new Date(), tempSettings.timezone)}
                  </span>
                </div>
                {hasChanges && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Button
                      onClick={saveSettings}
                      leftIcon={<Save className="h-4 w-4" />}
                      className="shadow-elevation-3"
                    >
                      Save Changes
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Settings - Compact Row */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Point System */}
        <Card hover className="border-primary-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary-500" />
              Point System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Block Min</label>
              <Input
                type="number"
                value={tempSettings.blockMinutes}
                onChange={(e) => update({blockMinutes: parseInt(e.target.value || '0', 10)})}
                inputSize="sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Pts/$</label>
              <Input
                type="number"
                value={tempSettings.pointsPerDollar}
                onChange={(e) => update({pointsPerDollar: parseInt(e.target.value || '0', 10)})}
                inputSize="sm"
              />
            </div>
            <div className="p-2 bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200 rounded-lg text-center">
              <div className="text-lg font-bold text-primary-600">{tempSettings.pointsPerDollar}p = $1</div>
            </div>
          </CardContent>
        </Card>

        {/* Screen Time Limits */}
        <Card hover className="border-secondary-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-secondary-500" />
              Screen Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">School Days</label>
              <div className="relative">
                <Input
                  type="number"
                  value={tempSettings.schooldayCapMinutes}
                  onChange={(e) => update({schooldayCapMinutes: parseInt(e.target.value || '0', 10)})}
                  inputSize="sm"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-semibold">Mins</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Weekend</label>
              <div className="relative">
                <Input
                  type="number"
                  value={tempSettings.weekendCapMinutes}
                  onChange={(e) => update({weekendCapMinutes: parseInt(e.target.value || '0', 10)})}
                  inputSize="sm"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-semibold">Mins</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Buffer 30 Mins</label>
              <div className="relative">
                <Input
                  type="number"
                  value={tempSettings.noScreenBufferMinutes}
                  onChange={(e) => update({noScreenBufferMinutes: parseInt(e.target.value || '0', 10)})}
                  inputSize="sm"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-semibold">Mins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card hover className="border-success-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <SettingsIcon className="h-4 w-4 text-success-500" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Timezone</label>
              <Select
                value={tempSettings.timezone}
                onChange={(e) => update({timezone: e.target.value})}
                className="text-xs"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Auto-Balance</label>
              <div className="flex gap-2">
                <Button
                  variant={tempSettings.autoBalanceEnabled ? "default" : "outline"}
                  onClick={() => update({autoBalanceEnabled: !tempSettings.autoBalanceEnabled})}
                  size="sm"
                  className="flex-1 text-xs"
                >
                  {tempSettings.autoBalanceEnabled ? 'On' : 'Off'}
                </Button>
                <Button
                  variant="warning"
                  onClick={() => {
                    app.autoBalancePoints()
                    alert('Points have been auto-balanced!')
                  }}
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Children Management */}
      <motion.div variants={staggerItem}>
        <Card hover className="overflow-hidden border-primary-200">
          <CardHeader className="bg-gradient-to-br from-primary-50 to-secondary-50 border-b border-primary-200 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary-500" />
                  Children Management
                </CardTitle>
                <CardDescription className="text-xs">Manage children's settings and points</CardDescription>
              </div>
              <Button
                variant="default"
                onClick={() => setShowAddChildDialog(true)}
                leftIcon={<Users className="h-4 w-4" />}
                size="sm"
                className="text-xs"
              >
                Add Child
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {h.children.map(c => {
                const currentPoints = app.ledger.filter(l => l.childId === c.id).reduce((a, b) => a + b.points, 0)
                return (
                  <motion.div
                    key={c.id}
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border border-primary-200">
                      <CardHeader className="bg-gradient-to-br from-primary-50/50 to-white pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                              {c.name}
                            </CardTitle>
                            <CardDescription className="text-xs font-semibold">{currentPoints} points</CardDescription>
                          </div>
                          <Badge variant="default" size="sm">Lvl {c.level}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Child's Name</label>
                          <Input
                            type="text"
                            value={c.name}
                            onChange={(e) => app.updateChild(c.id, cur => ({...cur, name: e.target.value}))}
                            inputSize="sm"
                            className="text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Weekly Cash Cap ($)</label>
                          <Input
                            type="number"
                            value={c.weeklyCashCap}
                            onChange={(e) => app.updateChild(c.id, cur => ({...cur, weeklyCashCap: parseInt(e.target.value || '0', 10)}))}
                            inputSize="sm"
                            className="text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">School Bed</label>
                            <Input
                              type="time"
                              value={c.bedtimes.school}
                              onChange={(e) => app.updateChild(c.id, cur => ({...cur, bedtimes: {...cur.bedtimes, school: e.target.value}}))}
                              inputSize="sm"
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Weekend Bed</label>
                            <Input
                              type="time"
                              value={c.bedtimes.weekend}
                              onChange={(e) => app.updateChild(c.id, cur => ({...cur, bedtimes: {...cur.bedtimes, weekend: e.target.value}}))}
                              inputSize="sm"
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Points</label>
                          <div className="grid grid-cols-4 gap-1">
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => resetChildPoints(c.id)}
                              className="text-xs"
                            >
                              Reset
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => addPoints(c.id, 10)}
                              className="text-xs"
                            >
                              +10
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => addPoints(c.id, 50)}
                              className="text-xs"
                            >
                              +50
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => addPoints(c.id, -10)}
                              className="text-xs"
                            >
                              -10
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Tasks</label>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => resetTodayTasks(c.id)}
                            leftIcon={<RefreshCw className="h-3 w-3" />}
                            className="w-full text-xs"
                          >
                            Reset Today
                          </Button>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Portal</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const inviteCode = app.generateInviteCode(c.id)
                                navigator.clipboard.writeText(`${window.location.origin}/child/${c.id}?invite=${inviteCode}`)
                                alert(`Invite link copied! Share this with ${c.name} to give them access to their portal.`)
                              }}
                              className="text-xs"
                            >
                              Copy Link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(`/child/${c.id}`, '_blank')
                              }}
                              className="text-xs"
                            >
                              Open Portal
                            </Button>
                          </div>
                        </div>

                        <GoalsEditor childId={c.id} />

                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${c.name}'s profile? This will remove all their data including points, tasks, and history. This action cannot be undone.`)) {
                                app.deleteChild(c.id)
                              }
                            }}
                            leftIcon={<Trash2 className="h-3 w-3" />}
                            className="w-full text-xs"
                          >
                            Delete {c.name}'s Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Child Dialog */}
      {showAddChildDialog && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAddChildDialog(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md mx-4 shadow-elevation-4 border-2 border-primary-200">
              <CardHeader className="bg-gradient-to-br from-primary-50 to-secondary-50 border-b-2 border-primary-200">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Users className="h-6 w-6 text-primary-500" />
                  Add New Child
                </CardTitle>
                <CardDescription>Add another child to your family</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Child's Name</label>
                  <Input
                    id="new-child-name"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Age</label>
                  <Input
                    id="new-child-age"
                    type="number"
                    placeholder="Enter age"
                    min="1"
                    max="18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Weekly Cash Cap ($)</label>
                  <Input
                    id="new-child-cash-cap"
                    type="number"
                    placeholder="Enter amount"
                    min="0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wide">School Bedtime</label>
                    <Input
                      id="new-child-bed-school"
                      type="time"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Weekend Bedtime</label>
                    <Input
                      id="new-child-bed-weekend"
                      type="time"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAddChildDialog(false)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full shadow-elevation-2"
                      onClick={() => {
                        const name = (document.getElementById('new-child-name') as HTMLInputElement).value
                        const age = parseInt((document.getElementById('new-child-age') as HTMLInputElement).value || '0', 10)
                        const cashCap = parseInt((document.getElementById('new-child-cash-cap') as HTMLInputElement).value || '0', 10)
                        const bedSchool = (document.getElementById('new-child-bed-school') as HTMLInputElement).value
                        const bedWeekend = (document.getElementById('new-child-bed-weekend') as HTMLInputElement).value

                        if (!name || !age || !bedSchool || !bedWeekend) {
                          alert('Please fill in all fields')
                          return
                        }

                        app.addChild(name, age, cashCap, bedSchool, bedWeekend)
                        setShowAddChildDialog(false)

                        // Clear inputs
                        ;(document.getElementById('new-child-name') as HTMLInputElement).value = ''
                        ;(document.getElementById('new-child-age') as HTMLInputElement).value = ''
                        ;(document.getElementById('new-child-cash-cap') as HTMLInputElement).value = ''
                        ;(document.getElementById('new-child-bed-school') as HTMLInputElement).value = ''
                        ;(document.getElementById('new-child-bed-weekend') as HTMLInputElement).value = ''
                      }}
                      leftIcon={<Users className="h-4 w-4" />}
                    >
                      Add Child
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Global Reset */}
      <motion.div variants={staggerItem}>
        <Card hover className="border-warning-300 bg-gradient-to-br from-warning-50/50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-warning-600" />
              Global Reset
            </CardTitle>
            <CardDescription className="text-xs">Reset tasks for all children at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-warning-300 bg-warning-50">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
              <AlertDescription className="text-xs">
                <strong>Parent Only:</strong> This will reset all completed tasks for all children today, allowing them to complete tasks again.
              </AlertDescription>
            </Alert>

            {/* Manual Reset */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Manual Reset</label>
              <div className="space-y-2">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => resetTodayTasks()}
                  leftIcon={<RefreshCw className="h-3 w-3" />}
                  className="w-full text-xs"
                >
                  Reset All Tasks Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deduplicateTasks()}
                  className="w-full text-xs"
                >
                  Remove Duplicate Tasks
                </Button>
              </div>
            </div>

            {/* Auto Reset Settings */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Enable Auto-Reset</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tempSettings.autoResetEnabled || false}
                    onChange={(e) => update({ autoResetEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                  />
                  <span className="text-xs text-neutral-600">Automatically reset all tasks daily at a specific time</span>
                </div>
              </div>

              {tempSettings.autoResetEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">
                      Reset Time ({tempSettings.timezone})
                    </label>
                    <Input
                      type="time"
                      value={tempSettings.autoResetTime || '00:00'}
                      onChange={(e) => update({ autoResetTime: e.target.value })}
                      inputSize="sm"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Tasks will automatically reset at this time every day
                      {tempSettings.lastAutoResetDate && ` (Last reset: ${tempSettings.lastAutoResetDate})`}
                    </p>
                  </div>
                  {tempSettings.lastAutoResetDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update({ lastAutoResetDate: undefined })}
                      className="text-xs"
                    >
                      Clear Last Reset Date
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Task Management - Organized by Child */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {h.children.map(child => (
          <Card key={child.id} hover>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary-500" />
                {child.name}'s Tasks
              </CardTitle>
              <CardDescription className="text-xs">Manage tasks for this child</CardDescription>
            </CardHeader>
            <CardContent>
              <CombinedTaskEditor
                baselineTasks={tempSettings.baselineTasks.filter(t => t.childId === child.id)}
                extraTasks={tempSettings.extraTasks.filter(t => t.childId === child.id)}
                onBaselineChange={(list) => {
                  // Keep tasks from other children only
                  const otherTasks = tempSettings.baselineTasks.filter(t => t.childId && t.childId !== child.id)
                  // Deduplicate by task ID
                  const allTasks = [...otherTasks, ...list]
                  const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values())
                  update({baselineTasks: uniqueTasks})
                }}
                onExtraChange={(list) => {
                  // Keep tasks from other children only
                  const otherTasks = tempSettings.extraTasks.filter(t => t.childId && t.childId !== child.id)
                  // Deduplicate by task ID
                  const allTasks = [...otherTasks, ...list]
                  const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values())
                  update({extraTasks: uniqueTasks})
                }}
                childId={child.id}
              />
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </motion.div>
  )
}

function CombinedTaskEditor({
  baselineTasks,
  extraTasks,
  onBaselineChange,
  onExtraChange,
  childId
}: {
  baselineTasks: TaskDef[]
  extraTasks: TaskDef[]
  onBaselineChange: (list: TaskDef[]) => void
  onExtraChange: (list: TaskDef[]) => void
  childId: string
}) {
  const [newTask, setNewTask] = useState({
    label: '',
    points: 5,
    category: 'baseline' as TaskCategory,
    difficulty: 'medium' as TaskDifficulty
  })
  const [draggedTask, setDraggedTask] = useState<{ id: string; category: 'baseline' | 'extra' } | null>(null)
  const [dragOverTask, setDragOverTask] = useState<string | null>(null)

  const allTasks = [...baselineTasks.map(t => ({...t, category: 'baseline' as TaskCategory})), ...extraTasks.map(t => ({...t, category: 'extra' as TaskCategory}))]

  const updateTask = (id: string, patch: Partial<TaskDef>) => {
    const task = allTasks.find(t => t.id === id)
    if (!task) return

    if (task.category === 'baseline') {
      const updatedList = baselineTasks.map(t => t.id === id ? {...t, ...patch} : t)
      onBaselineChange(updatedList)
    } else {
      const updatedList = extraTasks.map(t => t.id === id ? {...t, ...patch} : t)
      onExtraChange(updatedList)
    }
  }

  const removeTask = (id: string) => {
    const task = allTasks.find(t => t.id === id)
    if (!task) return

    if (task.category === 'baseline') {
      onBaselineChange(baselineTasks.filter(t => t.id !== id))
    } else {
      onExtraChange(extraTasks.filter(t => t.id !== id))
    }
  }

  const handleDragStart = (id: string, category: 'baseline' | 'extra') => {
    setDraggedTask({ id, category })
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverTask(targetId)
  }

  const handleDragLeave = () => {
    setDragOverTask(null)
  }

  const handleDrop = (targetId: string, targetCategory: 'baseline' | 'extra') => {
    setDragOverTask(null)

    if (!draggedTask || draggedTask.id === targetId) {
      setDraggedTask(null)
      return
    }

    // Only allow reordering within the same category
    if (draggedTask.category !== targetCategory) {
      setDraggedTask(null)
      return
    }

    if (draggedTask.category === 'baseline') {
      const draggedIndex = baselineTasks.findIndex(t => t.id === draggedTask.id)
      const targetIndex = baselineTasks.findIndex(t => t.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedTask(null)
        return
      }

      // Only allow reordering if both tasks belong to the same child (or both are global)
      const draggedTask_full = baselineTasks[draggedIndex]
      const targetTask_full = baselineTasks[targetIndex]

      if ((draggedTask_full.childId || null) !== (targetTask_full.childId || null)) {
        setDraggedTask(null)
        return
      }

      const newList = [...baselineTasks]
      const [removed] = newList.splice(draggedIndex, 1)
      newList.splice(targetIndex, 0, removed)
      onBaselineChange(newList)
    } else {
      const draggedIndex = extraTasks.findIndex(t => t.id === draggedTask.id)
      const targetIndex = extraTasks.findIndex(t => t.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedTask(null)
        return
      }

      // Only allow reordering if both tasks belong to the same child (or both are global)
      const draggedTask_full = extraTasks[draggedIndex]
      const targetTask_full = extraTasks[targetIndex]

      if ((draggedTask_full.childId || null) !== (targetTask_full.childId || null)) {
        setDraggedTask(null)
        return
      }

      const newList = [...extraTasks]
      const [removed] = newList.splice(draggedIndex, 1)
      newList.splice(targetIndex, 0, removed)
      onExtraChange(newList)
    }

    setDraggedTask(null)
  }

  const addTask = () => {
    if (!newTask.label.trim()) return
    const code = newTask.label.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    const task: TaskDef = {
      id: uuid(),
      code: code,
      label: newTask.label,
      points: newTask.points,
      category: newTask.category === 'baseline' ? 'mandatory' : 'extra',
      difficulty: newTask.difficulty,
      childId: childId
    }

    if (newTask.category === 'baseline') {
      onBaselineChange([...baselineTasks, task])
    } else {
      onExtraChange([...extraTasks, task])
    }

    setNewTask({ label: '', points: 5, category: 'baseline', difficulty: 'medium' })
  }

  return (
    <div className="space-y-3">
      {/* Add New Task */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide">Add New Task</label>
        <div className="space-y-2">
          <Input
            value={newTask.label}
            onChange={e => setNewTask({...newTask, label: e.target.value})}
            placeholder="e.g., Take out trash"
            inputSize="sm"
            className="text-xs"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Type</label>
              <Select
                value={newTask.category}
                onChange={e => setNewTask({...newTask, category: e.target.value as TaskCategory})}
                className="text-sm h-10 w-full"
              >
                <option value="baseline">Mandatory</option>
                <option value="extra">Optional</option>
              </Select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Difficulty</label>
              <Select
                value={newTask.difficulty}
                onChange={e => setNewTask({...newTask, difficulty: e.target.value as TaskDifficulty})}
                className="text-sm h-10 w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
          </div>

          <Button
            onClick={addTask}
            disabled={!newTask.label.trim()}
            className="w-full text-xs"
            size="sm"
            leftIcon={<Plus className="h-3 w-3" />}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Current Tasks */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide">Current Tasks ({allTasks.length})</label>
        <div className="space-y-2">
          {allTasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              onUpdate={updateTask}
              onRemove={removeTask}
              onDragStart={() => handleDragStart(t.id, t.category as 'baseline' | 'extra')}
              onDragOver={(e) => handleDragOver(e, t.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(t.id, t.category as 'baseline' | 'extra')}
              isDragging={draggedTask?.id === t.id}
              isDraggedOver={dragOverTask === t.id}
            />
          ))}
          {allTasks.length === 0 && (
            <div className="text-center py-6 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-xs">No tasks yet. Add one above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, onUpdate, onRemove, onDragStart, onDragOver, onDragLeave, onDrop, isDragging, isDraggedOver }: {
  task: TaskDef
  onUpdate: (id: string, patch: Partial<TaskDef>) => void
  onRemove: (id: string) => void
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: () => void
  isDragging?: boolean
  isDraggedOver?: boolean
}) {
  const [localLabel, setLocalLabel] = useState(task.label)
  const [localPoints, setLocalPoints] = useState(task.points.toString())
  const [localDifficulty, setLocalDifficulty] = useState<TaskDifficulty>(task.difficulty || 'medium')

  useEffect(() => {
    setLocalLabel(task.label)
    setLocalPoints(task.points.toString())
    setLocalDifficulty(task.difficulty || 'medium')
  }, [task.label, task.points, task.difficulty])

  const getDifficultyColor = (diff?: TaskDifficulty) => {
    switch(diff) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`p-3 bg-neutral-50 border border-neutral-200 rounded-lg relative transition-all duration-150 ${isDraggedOver ? 'ring-2 ring-primary-400 scale-[1.02]' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* Drag Handle */}
      {onDragStart && (
        <div
          draggable={true}
          onDragStart={onDragStart}
          className="absolute left-0 top-0 bottom-0 w-6 cursor-move flex items-center justify-center hover:bg-neutral-100 transition-colors border-r border-neutral-200"
        >
          <GripVertical className="h-4 w-4 text-neutral-400" />
        </div>
      )}

      {/* Task Content */}
      <div className={`space-y-2 ${onDragStart ? 'pl-6' : ''}`}>
        {/* Task Name */}
        <div>
          <Input
            value={localLabel}
            onChange={e => setLocalLabel(e.target.value)}
            onBlur={e => onUpdate(task.id, { label: e.target.value })}
            inputSize="sm"
            className="text-[11px]"
          />
        </div>

        {/* Task Details - Grid */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-end">
          <div className="w-12">
            <label className="block text-[10px] font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Type</label>
            <div className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-700">
              {task.category === 'mandatory' || task.category === 'baseline' ? 'M' : 'O'}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Difficulty</label>
            <Select
              value={localDifficulty}
              onChange={e => {
                const newDiff = e.target.value as TaskDifficulty
                setLocalDifficulty(newDiff)
                onUpdate(task.id, { difficulty: newDiff })
              }}
              className="text-sm h-10 w-full pr-8"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div className="w-16">
            <label className="block text-[10px] font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Points</label>
            <div className="flex h-9 items-center justify-center rounded-md border border-primary-200 bg-primary-50 text-xs font-bold text-primary-600">
              {task.points}
            </div>
          </div>
          <div className="w-16">
            <Button
              variant="destructive"
              onClick={() => onRemove(task.id)}
              className="w-full text-[10px] h-9"
              size="sm"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskEditor({ list, onChange, childId }:{ list: TaskDef[]; onChange:(l:TaskDef[])=>void; childId?: string }){
  const [newTask, setNewTask] = useState({
    label: '',
    points: 5,
    category: 'extra' as TaskCategory,
    difficulty: 'medium' as TaskDifficulty
  })

  const update = (id:string, patch: Partial<TaskDef>) => {
    const updatedList = list.map(t => t.id===id? {...t, ...patch } : t)
    onChange(updatedList)
  }

  const add = () => {
    if (!newTask.label.trim()) return
    const code = newTask.label.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    onChange(list.concat([{
      id: uuid(),
      code: code,
      label: newTask.label,
      points: newTask.points,
      category: newTask.category,
      difficulty: newTask.difficulty
    }]))
    setNewTask({ label: '', points: 5, category: 'extra', difficulty: 'medium' })
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <Select
                value={newTask.difficulty}
                onChange={e=>setNewTask({...newTask, difficulty: e.target.value as TaskDifficulty})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <Select
                value={newTask.category}
                onChange={e=>setNewTask({...newTask, category: e.target.value as TaskCategory})}
              >
                <option value="baseline">Mandatory</option>
                <option value="extra">Optional</option>
              </Select>
            </div>
          </div>
          <Alert>
            <AlertDescription className="text-sm">
              💡 Points are automatically calculated when you run Auto-Balance based on difficulty levels
            </AlertDescription>
          </Alert>

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
              <TaskRow key={t.id} task={t} onUpdate={update} onRemove={remove} />
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

function GoalsEditor({ childId }: { childId: string }) {
  const app = useApp()
  const household = app.household!
  const child = household.children.find(c => c.id === childId)!
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalAmount, setNewGoalAmount] = useState(100)

  // Initialize goals array if it doesn't exist
  const goals = child.goals || []

  const currentPoints = app.ledger.filter(l => l.childId === childId).reduce((a, b) => a + b.points, 0)
  const currentDollars = currentPoints / household.settings.pointsPerDollar

  const handleAddGoal = () => {
    if (!newGoalName.trim() || newGoalAmount <= 0) {
      alert('Please enter a valid goal name and amount')
      return
    }
    app.addGoal(childId, newGoalName, newGoalAmount)
    setNewGoalName('')
    setNewGoalAmount(100)
    setShowAddGoal(false)
  }

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      app.deleteGoal(childId, goalId)
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wide">Goals</label>

      {goals.length === 0 && !showAddGoal && (
        <div className="text-center py-3 px-2 bg-neutral-50 border border-neutral-200 rounded-lg">
          <Target className="h-5 w-5 mx-auto mb-1 text-neutral-300" />
          <p className="text-[10px] text-neutral-500">No goals yet</p>
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-2 mb-2">
          {goals.map(goal => {
            const progress = Math.min(100, (currentDollars / goal.targetAmount) * 100)
            return (
              <div key={goal.id} className="p-2 bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1">
                    <div className="text-xs font-bold text-primary-600">{goal.name}</div>
                    <div className="text-[10px] text-neutral-600">
                      ${currentDollars.toFixed(2)} / ${goal.targetAmount}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">{progress.toFixed(0)}% complete</div>
              </div>
            )
          })}
        </div>
      )}

      {!showAddGoal ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddGoal(true)}
          leftIcon={<Plus className="h-3 w-3" />}
          className="w-full text-xs"
        >
          Add Goal
        </Button>
      ) : (
        <div className="space-y-2 p-2 bg-white border-2 border-primary-300 rounded-lg">
          <div>
            <label className="block text-[10px] font-semibold text-neutral-700 mb-0.5 uppercase tracking-wide">Goal Name</label>
            <Input
              value={newGoalName}
              onChange={e => setNewGoalName(e.target.value)}
              placeholder="e.g., 3D Printer"
              inputSize="sm"
              className="text-xs h-7"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-neutral-700 mb-0.5 uppercase tracking-wide">Target Amount ($)</label>
            <Input
              type="number"
              value={newGoalAmount}
              onChange={e => setNewGoalAmount(parseInt(e.target.value || '0', 10))}
              min="1"
              inputSize="sm"
              className="text-xs h-7"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddGoal(false)
                setNewGoalName('')
                setNewGoalAmount(100)
              }}
              className="text-[10px] h-6"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddGoal}
              disabled={!newGoalName.trim() || newGoalAmount <= 0}
              className="text-[10px] h-6"
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
