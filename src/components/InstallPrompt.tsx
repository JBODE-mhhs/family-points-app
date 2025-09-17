import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="panel" style={{
      background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--panel) 100%)',
      border: '2px solid var(--primary)',
      marginBottom: '16px'
    }}>
      <div className="hstack" style={{justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div className="section-title">📱 Install App</div>
          <div className="section-subtitle">Add to home screen for easy access</div>
        </div>
        <div className="hstack" style={{gap: '8px'}}>
          <button 
            className="btn primary" 
            onClick={handleInstallClick}
            style={{padding: '12px 16px', fontSize: '14px'}}
          >
            Install
          </button>
          <button 
            className="btn ghost" 
            onClick={() => setShowInstallPrompt(false)}
            style={{padding: '12px 16px', fontSize: '14px'}}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}


