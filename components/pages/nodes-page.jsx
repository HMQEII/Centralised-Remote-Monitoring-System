"use client"

import { useState, useEffect, useCallback } from 'react'
import { Server, Wifi, WifiOff, RefreshCw, Pencil, Trash2, X } from 'lucide-react'

const API_BASE = '/api/v1'
const API_HEADERS = {
  'Authorization': `Bearer ${import.meta.env.VITE_HEADSCALE_API_KEY}`,
}

export default function NodesPage() {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [renameModal, setRenameModal] = useState({ open: false, node: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, node: null })
  const [newName, setNewName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchNodes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/node`, {
        headers: API_HEADERS
      })
      if (!response.ok) throw new Error('Failed to fetch nodes')
      const data = await response.json()
      setNodes(data.nodes || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNodes()
    const interval = setInterval(fetchNodes, 15000)
    return () => clearInterval(interval)
  }, [fetchNodes])

  const handleRename = async () => {
    if (!newName.trim()) return
    setActionLoading(true)
    try {
      const response = await fetch(`${API_BASE}/node/${renameModal.node.id}/rename/${encodeURIComponent(newName)}`, {
        method: 'POST',
        headers: API_HEADERS
      })
      if (!response.ok) throw new Error('Failed to rename node')
      await fetchNodes()
      setRenameModal({ open: false, node: null })
      setNewName('')
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`${API_BASE}/node/${deleteModal.node.id}`, {
        method: 'DELETE',
        headers: API_HEADERS
      })
      if (!response.ok) throw new Error('Failed to delete node')
      await fetchNodes()
      setDeleteModal({ open: false, node: null })
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const stats = {
    total: nodes.length,
    online: nodes.filter(n => n.online).length,
    offline: nodes.filter(n => !n.online).length
  }

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getOSBadge = (os) => {
    const isWindows = os?.toLowerCase().includes('windows')
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
        isWindows 
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      }`}>
        {isWindows ? 'Windows' : 'Linux'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Nodes</h1>
          <p className="text-[#6b7280] text-sm font-mono mt-1">Monitor and manage connected devices</p>
        </div>
        <button
          onClick={fetchNodes}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-[#243d7a] text-white rounded-md transition-colors font-sans text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-[#1B2F5E]" />
            </div>
            <div>
              <p className="text-[#6b7280] text-xs font-mono uppercase">Total Nodes</p>
              <p className="text-2xl font-bold text-white font-sans">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[#6b7280] text-xs font-mono uppercase">Online</p>
              <p className="text-2xl font-bold text-green-500 font-sans">{stats.online}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[#6b7280] text-xs font-mono uppercase">Offline</p>
              <p className="text-2xl font-bold text-red-500 font-sans">{stats.offline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 font-mono text-sm">{error}</p>
            <button 
              onClick={fetchNodes}
              className="mt-4 text-[#1B2F5E] hover:text-white text-sm font-mono"
            >
              Try again
            </button>
          </div>
        ) : loading && nodes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#1B2F5E]/30 border-t-[#1B2F5E] rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] mt-4 font-mono text-sm">Loading nodes...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="w-12 h-12 text-[#1f2937] mx-auto mb-3" />
            <p className="text-[#6b7280] font-mono text-sm">No nodes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Device Name</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">IP Address</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">OS</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Last Seen</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.id} className="border-b border-[#1f2937] last:border-0 hover:bg-[#111827] transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-white font-mono text-sm">{node.givenName || node.name || 'Unnamed'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#9ca3af] font-mono text-sm">{node.ipAddresses?.[0] || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getOSBadge(node.os)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono ${
                        node.online 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${node.online ? 'bg-green-400' : 'bg-red-400'}`} />
                        {node.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#9ca3af] font-mono text-sm">{formatLastSeen(node.lastSeen)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRenameModal({ open: true, node })
                            setNewName(node.givenName || node.name || '')
                          }}
                          className="p-1.5 rounded hover:bg-primary/30 text-[#6b7280] hover:text-white transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, node })}
                          className="p-1.5 rounded hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
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
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renameModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
              <h3 className="text-lg font-semibold text-white font-sans">Rename Node</h3>
              <button
                onClick={() => setRenameModal({ open: false, node: null })}
                className="text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[#6b7280] font-mono">New Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1f2937] rounded-md py-2.5 px-4 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#1B2F5E] focus:ring-1 focus:ring-[#1B2F5E] font-mono text-sm transition-colors"
                  placeholder="Enter new name"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[#1f2937]">
              <button
                onClick={() => setRenameModal({ open: false, node: null })}
                className="px-4 py-2 text-[#9ca3af] hover:text-white font-sans text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={actionLoading || !newName.trim()}
                className="px-4 py-2 bg-primary hover:bg-[#243d7a] text-white rounded-md font-sans text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Rename
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
              <h3 className="text-lg font-semibold text-white font-sans">Delete Node</h3>
              <button
                onClick={() => setDeleteModal({ open: false, node: null })}
                className="text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-[#9ca3af] font-mono text-sm">
                Are you sure you want to delete <span className="text-white">{deleteModal.node?.givenName || deleteModal.node?.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[#1f2937]">
              <button
                onClick={() => setDeleteModal({ open: false, node: null })}
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

