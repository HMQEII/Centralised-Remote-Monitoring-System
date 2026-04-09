// import { Monitor, Users, Key, LogOut } from 'lucide-react'
// import { cn } from '../lib/utils'

// const navItems = [
//   { id: 'nodes', label: 'Nodes', icon: Monitor },
//   { id: 'users', label: 'Users', icon: Users },
//   { id: 'auth-keys', label: 'Auth Keys', icon: Key },
// ]

// function Sidebar({ user, activePage, onPageChange, onLogout }) {
//   return (
//     <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
//       {/* Logo */}
//       <div className="p-6 border-b border-border">
//         <h1 className="text-xl font-bold text-foreground">
//           CR<span className="text-property">MS</span>
//         </h1>
//         <p className="text-xs text-muted-foreground mt-1">
//           Remote Monitoring System
//         </p>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 p-4">
//         <ul className="space-y-2">
//           {navItems.map((item) => {
//             const Icon = item.icon
//             const isActive = activePage === item.id
//             return (
//               <li key={item.id}>
//                 <button
//                   onClick={() => onPageChange(item.id)}
//                   className={cn(
//                     'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
//                     isActive
//                       ? 'bg-primary text-primary-foreground'
//                       : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
//                   )}
//                 >
//                   <Icon className="w-5 h-5" />
//                   {item.label}
//                 </button>
//               </li>
//             )
//           })}
//         </ul>
//       </nav>

//       {/* User Section */}
//       <div className="p-4 border-t border-border">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-sm font-medium text-foreground">{user?.name}</p>
//             <p className="text-xs text-muted-foreground">@{user?.username}</p>
//           </div>
//           <button
//             onClick={onLogout}
//             className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
//             title="Sign Out"
//           >
//             <LogOut className="w-5 h-5" />
//           </button>
//         </div>
//       </div>
//     </aside>
//   )
// }

// export default Sidebar
import { Monitor, Users, Key, LogOut, Moon, Sun } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from './ThemeContext'

const navItems = [
  { id: 'nodes', label: 'Nodes', icon: Monitor },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'auth-keys', label: 'Auth Keys', icon: Key },
]

function Sidebar({ user, activePage, onPageChange, onLogout }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card dark:bg-card-dark border-r border-border dark:border-border-dark flex flex-col">
  {/* Logo */}
  <div className="p-6 border-b border-border dark:border-border-dark">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-foreground dark:text-foreground-dark">
          CR<span className="text-property">MS</span>
        </h1>
        <p className="text-xs text-muted-foreground dark:text-muted-foreground-dark mt-1">
          Remote Monitoring System
        </p>
      </div>
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 p-4">
    <ul className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activePage === item.id
        return (
          <li key={item.id}>
            <button
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:hover:text-foreground-dark hover:bg-secondary dark:hover:bg-secondary-dark'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          </li>
        )
      })}
    </ul>
  </nav>

  {/* User Section */}
  <div className="p-4 border-t border-border dark:border-border-dark">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground dark:text-foreground-dark">{user?.name}</p>
        <p className="text-xs text-muted-foreground dark:text-muted-foreground-dark">@{user?.username}</p>
      </div>
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:hover:text-foreground-dark hover:bg-secondary dark:hover:bg-secondary-dark rounded-md transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {/* {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} */}
          {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={onLogout}
          className="p-2 text-muted-foreground dark:text-muted-foreground-dark hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</aside>
  )
}

export default Sidebar