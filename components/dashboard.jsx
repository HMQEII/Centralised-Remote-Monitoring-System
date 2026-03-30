"use client"

import { useState } from 'react'
import Sidebar from './sidebar'
import NodesPage from './pages/nodes-page'
import UsersPage from './pages/users-page'
import AuthKeysPage from './pages/auth-keys-page'

export default function Dashboard({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('nodes')

  const renderPage = () => {
    switch (activePage) {
      case 'nodes':
        return <NodesPage />
      case 'users':
        return <UsersPage />
      case 'authkeys':
        return <AuthKeysPage />
      default:
        return <NodesPage />
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <main className="flex-1 ml-64 p-6">
        {renderPage()}
      </main>
    </div>
  )
}
