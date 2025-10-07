import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../state/store'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Users, UserPlus, Trash2, Sparkles, Shield, Info } from 'lucide-react'
import { staggerContainer, staggerItem, fadeVariants } from '../theme/motion'

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 py-12 px-4">
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Header */}
        <motion.div variants={staggerItem} className="text-center space-y-4">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-elevation-3 mb-4"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Sparkles className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Welcome to Family Points!
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Set up your family's point system in just a few steps
          </p>
        </motion.div>

        {/* Info Card */}
        <motion.div variants={staggerItem}>
          <Card variant="elevated" className="border-primary-100 bg-gradient-to-br from-primary-50/50 to-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-primary-100">
                  <Info className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-2">Default Settings</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    School days: 2h cap • Weekends: 5h/day cap • 30m buffer before bed • 1 point = 1 minute • 50 points = $1
                    <br />
                    <span className="text-primary-600 font-medium">You can customize everything later in settings.</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Family Name */}
        <motion.div variants={staggerItem}>
          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                Family Name
              </CardTitle>
              <CardDescription>What should we call your household?</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={family}
                onChange={e => setFamily(e.target.value)}
                placeholder="Enter your family name"
                className="text-lg"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Children */}
        <motion.div variants={staggerItem}>
          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary-500" />
                    Children
                  </CardTitle>
                  <CardDescription>Add your children to get started</CardDescription>
                </div>
                <Button
                  onClick={addChild}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                  size="sm"
                >
                  Add Child
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {children.map((child, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card variant="outlined" className="relative">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="default" size="lg">
                            Child {i + 1}
                          </Badge>
                          {children.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChild(i)}
                            >
                              <Trash2 className="h-4 w-4 text-error-500" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Name
                          </label>
                          <Input
                            value={child.name}
                            onChange={e => updateChild(i, 'name', e.target.value)}
                            placeholder="Child's name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Age
                          </label>
                          <Input
                            type="number"
                            value={child.age}
                            onChange={e => updateChild(i, 'age', parseInt(e.target.value || '0', 10))}
                            min="1"
                            max="18"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Weekly Cash Cap ($)
                          </label>
                          <Input
                            type="number"
                            value={child.weeklyCashCap}
                            onChange={e => updateChild(i, 'weeklyCashCap', parseInt(e.target.value || '0', 10))}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              School Bedtime
                            </label>
                            <Input
                              value={child.bedSchool}
                              onChange={e => updateChild(i, 'bedSchool', e.target.value)}
                              placeholder="9:00 PM"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              Weekend Bedtime
                            </label>
                            <Input
                              value={child.bedWeekend}
                              onChange={e => updateChild(i, 'bedWeekend', e.target.value)}
                              placeholder="10:00 PM"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parent Account */}
        <motion.div variants={staggerItem}>
          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-500" />
                Parent Account
              </CardTitle>
              <CardDescription>Create your parent login credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Username
                  </label>
                  <Input
                    value={parentUsername}
                    onChange={e => setParentUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={parentPassword}
                    onChange={e => setParentPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary-50 border border-primary-100">
                <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary-900">
                  You can invite another parent later in the settings. This account will be the primary administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Button */}
        <motion.div
          variants={staggerItem}
          className="flex justify-center pt-4"
        >
          <Button
            onClick={start}
            size="lg"
            className="px-12 text-lg shadow-elevation-3 hover:shadow-elevation-4"
            leftIcon={<Sparkles className="h-5 w-5" />}
          >
            Create Household
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
