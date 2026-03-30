"use client"

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Trash2, X } from 'lucide-react'

const API_BASE = '/api/v1'
const API_HEADERS = {
  'Authorization': `Bearer ${import.meta.env.VITE_HEADSCALE_API_KEY}`,
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null })
  const [newUserName, setNewUserName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/user`, {
        headers: API_HEADERS
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreate = async () => {
    if (!newUserName.trim()) return
    setActionLoading(true)
    try {
      const response = await fetch(`${API_BASE}/user`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ name: newUserName })
      })
      if (!response.ok) throw new Error('Failed to create user')
      await fetchUsers()
      setCreateModal(false)
      setNewUserName('')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`${API_BASE}/user/${encodeURIComponent(deleteModal.user.name)}`, {
        method: 'DELETE',
        headers: API_HEADERS
      })
      if (!response.ok) throw new Error('Failed to delete user')
      await fetchUsers()
      setDeleteModal({ open: false, user: null })
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Users</h1>
          <p className="text-[#6b7280] text-sm font-mono mt-1">Manage system users</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B2F5E] hover:bg-[#243d7a] text-white rounded-md transition-colors font-sans text-sm"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 font-mono text-sm">{error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-4 text-[#1B2F5E] hover:text-white text-sm font-mono"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#1B2F5E]/30 border-t-[#1B2F5E] rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] mt-4 font-mono text-sm">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-[#1f2937] mx-auto mb-3" />
            <p className="text-[#6b7280] font-mono text-sm">No users found</p>
            <button
              onClick={() => setCreateModal(true)}
              className="mt-4 text-[#1B2F5E] hover:text-white text-sm font-mono"
            >
              Create your first user
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Created</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#1f2937] last:border-0 hover:bg-[#111827] transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-[#9ca3af] font-mono text-sm">{user.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white font-mono text-sm">{user.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#9ca3af] font-mono text-sm">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteModal({ open: true, user })}
                        className="p-1.5 rounded hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
              <h3 className="text-lg font-semibold text-white font-sans">Create User</h3>
              <button
                onClick={() => setCreateModal(false)}
                className="text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[#6b7280] font-mono">User Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-md py-2.5 px-4 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#1B2F5E] focus:ring-1 focus:ring-[#1B2F5E] font-mono text-sm transition-colors"
                  placeholder="Enter user name"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[#1f2937]">
              <button
                onClick={() => setCreateModal(false)}
                className="px-4 py-2 text-[#9ca3af] hover:text-white font-sans text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading || !newUserName.trim()}
                className="px-4 py-2 bg-[#1B2F5E] hover:bg-[#243d7a] text-white rounded-md font-sans text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
              <h3 className="text-lg font-semibold text-white font-sans">Delete User</h3>
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-[#9ca3af] font-mono text-sm">
                Are you sure you want to delete <span className="text-white">{deleteModal.user?.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[#1f2937]">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 text-[#9ca3af] hover:text-white font-sans text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-sans text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
