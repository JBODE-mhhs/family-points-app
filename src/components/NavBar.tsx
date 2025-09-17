import { Link, useLocation } from 'react-router-dom'

export default function NavBar() {
  const loc = useLocation()
  const active = (p: string) => loc.pathname.startsWith(p) ? 'btn primary' : 'btn'
  const isChildView = loc.pathname.startsWith('/child/')
  
  return (
    <div className="panel safe-area-top" style={{
      display:'flex', 
      alignItems:'center', 
      justifyContent:'space-between', 
      marginBottom:20, 
      padding: '16px 20px',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div className="hstack" style={{flex: '1', minWidth: '200px'}}>
        <div style={{fontWeight:800, fontSize: '18px'}}>🏠 Family Points</div>
        <span className="tag" style={{fontSize: '10px', padding: '2px 6px'}}>PWA</span>
        {isChildView && <span className="tag" style={{background: 'var(--kid-primary)', color: 'white', fontSize: '10px', padding: '2px 6px'}}>KID</span>}
      </div>
      <div className="hstack" style={{gap: '6px', flexWrap: 'wrap'}}>
        {!isChildView && (
          <>
            <Link className={active('/parent')} to="/parent" style={{padding: '8px 12px', fontSize: '14px'}}>📊 Parent</Link>
            <Link className={active('/settings')} to="/settings" style={{padding: '8px 12px', fontSize: '14px'}}>⚙️ Settings</Link>
            <Link className={active('/bank')} to="/bank" style={{padding: '8px 12px', fontSize: '14px'}}>💰 Weekend</Link>
          </>
        )}
      </div>
    </div>
  )
}
