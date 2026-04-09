import { useState } from 'react'
import Sidebar from './Sidebar'
import NodesPage from './pages/NodesPage'
import UsersPage from './pages/UsersPage'
import AuthKeysPage from './pages/AuthKeysPage'

function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('nodes')

  const renderPage = () => {
    switch (activePage) {
      case 'nodes':
        return <NodesPage />
      case 'users':
        return <UsersPage />
      case 'auth-keys':
        return <AuthKeysPage />
      default:
        return <NodesPage />
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex">
      <Sidebar
        user={user}
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={onLogout}
      />
      <main className="flex-1 ml-64 p-8">
        {renderPage()}
      </main>
    </div>
  )
}

export default Dashboard
