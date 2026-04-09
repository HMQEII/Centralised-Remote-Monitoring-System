import { useState, useEffect } from 'react'
import { Plus, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react'
import { getUsers, createUser, deleteUser, isConfigured } from '../../api/headscale'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null })
  const [newUserName, setNewUserName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    if (!isConfigured()) {
      setError('Headscale API not configured. Please set VITE_HEADSCALE_URL and VITE_HEADSCALE_API_KEY in your .env file.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getUsers()
      const transformedUsers = data.map(user => ({
        id: user.id,
        name: user.name,
        created: formatDate(user.createdAt),
      }))
      setUsers(transformedUsers)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const handleCreate = async () => {
    if (!newUserName.trim()) return
    try {
      setActionLoading(true)
      await createUser(newUserName.trim())
      await fetchUsers()
      setCreateModal(false)
      setNewUserName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await deleteUser(deleteModal.user.name)
      await fetchUsers()
      setDeleteModal({ open: false, user: null })
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">Users</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:text-foreground-dark hover:bg-secondary dark:bg-secondary-dark rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-muted-foreground dark:text-muted-foreground-dark animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground-dark">
            No users found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-border-dark bg-secondary dark:bg-secondary-dark/50">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">Created</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border dark:border-border-dark last:border-0 hover:bg-secondary dark:bg-secondary-dark/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground dark:text-muted-foreground-dark">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-foreground dark:text-foreground-dark font-medium">{user.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground dark:text-muted-foreground-dark">{user.created}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDeleteModal({ open: true, user })}
                        className="p-2 text-muted-foreground dark:text-muted-foreground-dark hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {createModal && (
        <Modal title="Create User" onClose={() => setCreateModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Username</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter username"
              />
              <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground-dark">
                In Headscale, users are namespaces that group nodes together.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCreateModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:text-foreground-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading || !newUserName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <Modal title="Delete User" onClose={() => setDeleteModal({ open: false, user: null })}>
          <div className="space-y-4">
            <p className="text-muted-foreground dark:text-muted-foreground-dark">
              Are you sure you want to delete <span className="text-foreground dark:text-foreground-dark font-medium">{deleteModal.user?.name}</span>? This will also remove all nodes and keys associated with this user.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:text-foreground-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 animate-fadeIn" onClick={onClose} />
      <div className="relative bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg w-full max-w-md p-6 animate-slideIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:text-foreground-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default UsersPage
