"use client"

import { Server, Users, Key, LogOut } from 'lucide-react'

const navItems = [
  { id: 'nodes', label: 'Nodes', icon: Server },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'authkeys', label: 'Auth Keys', icon: Key },
]

export default function Sidebar({ activePage, setActivePage, currentUser, onLogout }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a0f1a] border-r border-[#1f2937] flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1B2F5E] flex items-center justify-center">
            <span className="text-sm font-bold text-white font-sans">UC</span>
          </div>
          <div>
            <h1 className="text-white font-sans font-bold text-lg leading-tight">CRMS</h1>
            <p className="text-[#6b7280] text-xs font-mono">ULTeam Comptech</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-[#6b7280] text-xs font-mono uppercase tracking-wider mb-3 px-3">
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-sans text-sm ${
                    isActive
                      ? 'bg-[#1B2F5E] text-white'
                      : 'text-[#9ca3af] hover:text-white hover:bg-[#111827]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#1f2937]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#1B2F5E] flex items-center justify-center">
            <span className="text-xs font-medium text-white uppercase font-sans">
              {currentUser?.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-sans capitalize truncate">{currentUser}</p>
            <p className="text-[#6b7280] text-xs font-mono">Logged in</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[#111827] hover:bg-[#1f2937] text-[#9ca3af] hover:text-white transition-colors text-sm font-sans"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
