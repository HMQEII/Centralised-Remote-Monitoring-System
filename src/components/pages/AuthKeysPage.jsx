import { useState, useEffect } from 'react'
import { Plus, Copy, Check, X, RefreshCw, AlertCircle, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getUsers, getAllPreAuthKeys, createPreAuthKey, expirePreAuthKey, isConfigured } from '../../api/headscale'

const expiryOptions = [
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: '1y' },
]

function AuthKeysPage() {
  const [keys, setKeys] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generateModal, setGenerateModal] = useState(false)
  const [generatedKey, setGeneratedKey] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [form, setForm] = useState({ user: '', expiry: '24h', reusable: false, ephemeral: false })

  const fetchData = async () => {
    if (!isConfigured()) {
      setError('Headscale API not configured. Please set VITE_HEADSCALE_URL and VITE_HEADSCALE_API_KEY in your .env file.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const [usersData, keysData] = await Promise.all([
        getUsers(),
        getAllPreAuthKeys()
      ])
      
      setUsers(usersData.map(u => u.name))
      
      const transformedKeys = keysData.map(key => ({
        id: key.id,
        key: key.key,
        user: key.user,
        reusable: key.reusable,
        ephemeral: key.ephemeral,
        used: key.used,
        expiration: formatDate(key.expiration),
        expired: new Date(key.expiration) < new Date(),
        createdAt: formatDate(key.createdAt),
      }))
      
      setKeys(transformedKeys)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const calculateExpiration = (expiry) => {
    const date = new Date()
    switch (expiry) {
      case '1h': date.setHours(date.getHours() + 1); break
      case '24h': date.setDate(date.getDate() + 1); break
      case '7d': date.setDate(date.getDate() + 7); break
      case '30d': date.setDate(date.getDate() + 30); break
      case '90d': date.setDate(date.getDate() + 90); break
      case '1y': date.setFullYear(date.getFullYear() + 1); break
    }
    return date.toISOString()
  }

  const handleGenerate = async () => {
    if (!form.user) return
    try {
      setActionLoading(true)
      const expiration = calculateExpiration(form.expiry)
      const newKey = await createPreAuthKey(form.user, form.reusable, form.ephemeral, expiration)
      setGeneratedKey(newKey.key)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExpire = async (key) => {
    try {
      setActionLoading(true)
      await expirePreAuthKey(key.user, key.key)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopy = async (key, id) => {
    await navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const closeModal = () => {
    setGenerateModal(false)
    setGeneratedKey(null)
    setForm({ user: '', expiry: '24h', reusable: false, ephemeral: false })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pre-Auth Keys</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Key
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
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading && keys.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No pre-auth keys found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Key</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Reusable</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Ephemeral</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Used</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Expiration</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((authKey) => (
                <tr key={authKey.id} className={cn(
                  "border-b border-border last:border-0 hover:bg-secondary/30 transition-colors",
                  authKey.expired && "opacity-50"
                )}>
                  <td className="px-6 py-4">
                    <code className="font-mono text-sm text-foreground bg-secondary px-2 py-1 rounded">
                      {authKey.key.slice(0, 16)}...
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{authKey.user}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded',
                      authKey.reusable ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                    )}>
                      {authKey.reusable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded',
                      authKey.ephemeral ? 'bg-blue-500/20 text-blue-400' : 'bg-muted text-muted-foreground'
                    )}>
                      {authKey.ephemeral ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded',
                      authKey.used ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground'
                    )}>
                      {authKey.used ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-mono text-sm",
                      authKey.expired ? "text-red-400" : "text-muted-foreground"
                    )}>
                      {authKey.expiration}
                      {authKey.expired && " (Expired)"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopy(authKey.key, authKey.id)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                        title="Copy Key"
                      >
                        {copiedId === authKey.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {!authKey.expired && (
                        <button
                          onClick={() => handleExpire(authKey)}
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                          title="Expire Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Modal */}
      {generateModal && (
        <Modal title="Generate Pre-Auth Key" onClose={closeModal}>
          {generatedKey ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-md p-3">
                Make sure to copy your key now. You will not be able to see it again.
              </div>
              <div className="bg-secondary border border-border rounded-md p-4">
                <code className="font-mono text-sm text-foreground break-all">{generatedKey}</code>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleCopy(generatedKey, 'generated')}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  {copiedId === 'generated' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === 'generated' ? 'Copied!' : 'Copy Key'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">User</label>
                <select
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  className="w-full bg-input border border-border rounded-md py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Expiration</label>
                <select
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  className="w-full bg-input border border-border rounded-md py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {expiryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="reusable"
                    checked={form.reusable}
                    onChange={(e) => setForm({ ...form, reusable: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="reusable" className="text-sm text-foreground">Reusable</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="ephemeral"
                    checked={form.ephemeral}
                    onChange={(e) => setForm({ ...form, ephemeral: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="ephemeral" className="text-sm text-foreground">Ephemeral</label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ephemeral nodes are automatically removed when they go offline.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!form.user || actionLoading}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
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

export default AuthKeysPage
