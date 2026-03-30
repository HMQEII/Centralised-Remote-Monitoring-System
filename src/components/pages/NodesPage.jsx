import { useState, useEffect } from 'react'
import { Monitor, Wifi, WifiOff, Pencil, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getNodes, deleteNode, renameNode, isConfigured } from '../../api/headscale'

function NodesPage() {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [renameModal, setRenameModal] = useState({ open: false, node: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, node: null })
  const [newName, setNewName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchNodes = async () => {
    if (!isConfigured()) {
      setError('Headscale API not configured. Please set VITE_HEADSCALE_URL and VITE_HEADSCALE_API_KEY in your .env file.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getNodes()
      // Transform Headscale node data to our format
      const transformedNodes = data.map(node => ({
        id: node.id,
        name: node.givenName || node.name,
        ip: node.ipAddresses?.[0] || 'N/A',
        os: detectOS(node.hostInfo?.OS || ''),
        status: node.online ? 'online' : 'offline',
        lastSeen: formatDate(node.lastSeen),
        user: node.user?.name || 'unknown',
      }))
      setNodes(transformedNodes)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodes()
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchNodes, 15000)
    return () => clearInterval(interval)
  }, [])

  const detectOS = (osString) => {
    const os = osString.toLowerCase()
    if (os.includes('windows')) return 'Windows'
    if (os.includes('linux') || os.includes('ubuntu') || os.includes('debian') || os.includes('centos')) return 'Linux'
    if (os.includes('darwin') || os.includes('macos')) return 'macOS'
    if (os.includes('android')) return 'Android'
    if (os.includes('ios')) return 'iOS'
    return osString || 'Unknown'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const stats = {
    total: nodes.length,
    online: nodes.filter(n => n.status === 'online').length,
    offline: nodes.filter(n => n.status === 'offline').length,
  }

  const handleRename = async () => {
    if (!newName.trim()) return
    try {
      setActionLoading(true)
      await renameNode(renameModal.node.id, newName.trim())
      await fetchNodes()
      setRenameModal({ open: false, node: null })
      setNewName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await deleteNode(deleteModal.node.id)
      await fetchNodes()
      setDeleteModal({ open: false, node: null })
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nodes</h1>
        <button
          onClick={fetchNodes}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Nodes" value={stats.total} icon={Monitor} iconColor="text-cyan-500" />
        <StatCard label="Online" value={stats.online} icon={Wifi} variant="success" />
        <StatCard label="Offline" value={stats.offline} icon={WifiOff} variant="danger" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading && nodes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No nodes found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Device Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">IP Address</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">User</th>
                {/* <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">OS</th> */}
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Last Seen</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-foreground">{node.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{node.ip}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{node.user}</td>
                  {/* <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded',
                      node.os === 'Windows' ? 'bg-blue-500/20 text-blue-400' : 
                      node.os === 'Linux' ? 'bg-yellow-500/20 text-yellow-400' :
                      node.os === 'macOS' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-purple-500/20 text-purple-400'
                    )}>
                      {node.os}
                    </span>
                  </td> */}
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded',
                      node.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    )}>
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        node.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                      )} />
                      {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{node.lastSeen}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setRenameModal({ open: true, node })
                          setNewName(node.name)
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                        title="Rename"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, node })}
                        className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
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

      {/* Rename Modal */}
      {renameModal.open && (
        <Modal title="Rename Node" onClose={() => setRenameModal({ open: false, node: null })}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">New Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-input border border-border rounded-md py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter new name"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRenameModal({ open: false, node: null })}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <Modal title="Delete Node" onClose={() => setDeleteModal({ open: false, node: null })}>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <span className="text-foreground font-medium">{deleteModal.node?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, node: null })}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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

function StatCard({ label, value, icon: Icon, variant, iconColor }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={cn(
            'text-3xl font-bold',
            variant === 'success' ? 'text-green-400' : variant === 'danger' ? 'text-red-400' : 'text-foreground'
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          variant === 'success' ? 'bg-green-500/20' : variant === 'danger' ? 'bg-red-500/20' : 'bg-cyan-400/10'
        )}>
          <Icon className={cn(
            'w-6 h-6',
            iconColor || (variant === 'success' ? 'text-green-400' : variant === 'danger' ? 'text-red-400' : 'text-primary')
          )} />
        </div>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 animate-fadeIn" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 animate-slideIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default NodesPage
