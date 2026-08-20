import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, Hospital, MessageSquare, AlertTriangle, BarChart2 } from 'lucide-react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Activity Log Tracker',
  description: 'Manage daily activity logs, hospital onboarding stages, and discussions.',
}

import { cookies, headers } from 'next/headers'
import { verifySession } from '../../lib/auth'
import { LogOut, Users, ClipboardList } from 'lucide-react'
import LogoutButton from './components/LogoutButton'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  const session = sessionCookie ? await verifySession(sessionCookie.value) : null

  // If no session (e.g. login page), don't render sidebar
  if (!session) {
    return (
      <html lang="en" className={inter.className}>
        <body>
          {children}
        </body>
      </html>
    )
  }

  const role = session.role as string;
  const email = session.email as string;

  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="sidebar-logo">
              <img src="/logo.png" alt="LinkedCare" style={{ height: '40px', objectFit: 'contain' }} />
            </div>
            
            <nav className="nav-links">
              <Link href="/" className="nav-item">
                <Activity size={18} strokeWidth={2} />
                <span>Activity Log</span>
              </Link>
              <Link href="/hospitals" className="nav-item">
                <Hospital size={18} strokeWidth={2} />
                <span>Hospitals</span>
              </Link>
              <Link href="/discussions" className="nav-item">
                <MessageSquare size={18} strokeWidth={2} />
                <span>Discussions</span>
              </Link>
              <Link href="/renewals" className="nav-item">
                <AlertTriangle size={18} strokeWidth={2} />
                <span>Renewals</span>
              </Link>
              <Link href="/analytics" className="nav-item">
                <BarChart2 size={18} strokeWidth={2} />
                <span>Analytics</span>
              </Link>
              {role === 'admin' && (
                <>
                  <Link href="/users" className="nav-item">
                    <Users size={18} strokeWidth={2} />
                    <span>Users</span>
                  </Link>
                  <Link href="/audit" className="nav-item">
                    <ClipboardList size={18} strokeWidth={2} />
                    <span>Audit Logs</span>
                  </Link>
                </>
              )}
            </nav>
            
            <div className="sidebar-footer">
              <div className="user-profile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar">{email.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <span className="user-name" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.split('@')[0]}</span>
                    <span className="user-role" style={{ textTransform: 'capitalize' }}>{role}</span>
                  </div>
                </div>
                <LogoutButton />
              </div>
            </div>
          </aside>
          
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
