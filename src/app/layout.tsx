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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-icon-container">
                <Activity color="var(--primary)" size={24} strokeWidth={2.5} />
              </div>
              <span>LogTracker</span>
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
            </nav>
            
            <div className="sidebar-footer">
              <div className="user-profile">
                <div className="avatar">A</div>
                <div className="user-info">
                  <span className="user-name">Admin User</span>
                  <span className="user-role">Workspace Owner</span>
                </div>
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
