"use client"

import { useState, useEffect, useCallback } from 'react'
import { Key, Plus, Copy, Check, AlertTriangle, X } from 'lucide-react'

const API_BASE = '/api/v1'
const API_HEADERS = {
  'Authorization': `Bearer ${import.meta.env.VITE_HEADSCALE_API_KEY}`,
}

const EXPIRY_OPTIONS = [
  { label: '24 hours', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '1 year', value: '1y' },
  { label: 'Never', value: 'never' }
]

export default function AuthKeysPage() {
  const [keys, setKeys] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [generatedKey, setGeneratedKey] = useState(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [expiry, setExpiry] = useState('7d')
  const [reusable, setReusable] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/user`, {
        headers: API_HEADERS
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }, [])

  const fetchKeys = useCallback(async (userName) => {
    try {
      const response = await fetch(`${API_BASE}/preauthkey?user=${encodeURIComponent(userName)}`, {
        headers: API_HEADERS
      })
      if (!response.ok) throw new Error('Failed to fetch keys')
      const data = await response.json()
      return data.preAuthKeys || []
    } catch (err) {
      console.error('Failed to fetch keys for user:', userName, err)
      return []
    }
  }, [])

  const fetchAllKeys = useCallback(async () => {
    setLoading(true)
    try {
      await fetchUsers()
      const usersResponse = await fetch(`${API_BASE}/user`, {
        headers: API_HEADERS
      })
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const usersData = await usersResponse.json()
      const usersList = usersData.users || []
      
      const allKeys = []
      for (const user of usersList) {
        const userKeys = await fetchKeys(user.name)
        allKeys.push(...userKeys.map(key => ({ ...key, userName: user.name })))
      }
      setKeys(allKeys)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchUsers, fetchKeys])

  useEffect(() => {
    fetchAllKeys()
  }, [fetchAllKeys])

  const calculateExpiry = (expiryOption) => {
    const now = new Date()
    switch (expiryOption) {
      case '24h':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      case '7d':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      case '1y':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
      case 'never':
        return null
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const handleGenerate = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const expirationDate = calculateExpiry(expiry)
      const body = {
        user: selectedUser,
        reusable: reusable,
        ephemeral: false
      }
      if (expirationDate) {
        body.expiration = expirationDate
      }

      const response = await fetch(`${API_BASE}/preauthkey`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(body)
      })
      if (!response.ok) throw new Error('Failed to generate key')
      const data = await response.json()
      setGeneratedKey(data.preAuthKey?.key || data.key)
      await fetchAllKeys()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopy = async (key) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const closeModal = () => {
    setCreateModal(false)
    setGeneratedKey(null)
    setSelectedUser('')
    setExpiry('7d')
    setReusable(false)
  }

  const truncateKey = (key) => {
    if (!key || key.length <= 20) return key
    return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`
  }

  const formatExpiry = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    if (date < now) return 'Expired'
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
          <h1 className="text-2xl font-bold text-white font-sans">Auth Keys</h1>
          <p className="text-[#6b7280] text-sm font-mono mt-1">Manage pre-authentication keys</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B2F5E] hover:bg-[#243d7a] text-white rounded-md transition-colors font-sans text-sm"
        >
          <Plus className="w-4 h-4" />
          Generate Key
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 font-mono text-sm">{error}</p>
            <button 
              onClick={fetchAllKeys}
              className="mt-4 text-[#1B2F5E] hover:text-white text-sm font-mono"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#1B2F5E]/30 border-t-[#1B2F5E] rounded-full animate-spin mx-auto" />
            <p className="text-[#6b7280] mt-4 font-mono text-sm">Loading auth keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="w-12 h-12 text-[#1f2937] mx-auto mb-3" />
            <p className="text-[#6b7280] font-mono text-sm">No auth keys found</p>
            <button
              onClick={() => setCreateModal(true)}
              className="mt-4 text-[#1B2F5E] hover:text-white text-sm font-mono"
            >
              Generate your first key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Key</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Reusable</th>
                  <th className="text-left py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Expiration</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] text-xs font-mono uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((authKey, index) => (
                  <tr key={index} className="border-b border-[#1f2937] last:border-0 hover:bg-[#111827] transition-colors">
                    <td className="py-3 px-4">
                      <code className="text-[#9ca3af] font-mono text-sm bg-[#111827] px-2 py-1 rounded">
                        {truncateKey(authKey.key)}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white font-mono text-sm">{authKey.userName || authKey.user}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                        authKey.reusable 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-[#1f2937] text-[#6b7280] border border-[#374151]'
                      }`}>
                        {authKey.reusable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#9ca3af] font-mono text-sm">{formatExpiry(authKey.expiration)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleCopy(authKey.key)}
                        className="p-1.5 rounded hover:bg-[#1B2F5E]/30 text-[#6b7280] hover:text-white transition-colors"
                        title="Copy key"
                      >
                        {copiedKey === authKey.key ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0d1320] border border-[#1f2937] rounded-lg w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
              <h3 className="text-lg font-semibold text-white font-sans">
                {generatedKey ? 'Key Generated' : 'Generate Auth Key'}
              </h3>
              <button
                onClick={closeModal}
                className="text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {generatedKey ? (
              <div className="p-4 space-y-4">
                {/* Warning */}
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-400 text-sm font-mono">
                    Copy this key now. It won&apos;t be shown again!
                  </p>
                </div>
                
                {/* Key Display */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-md p-4">
                  <code className="text-green-400 font-mono text-sm break-all block">
                    {generatedKey}
                  </code>
                </div>
                
                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(generatedKey)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B2F5E] hover:bg-[#243d7a] text-white rounded-md font-sans text-sm transition-colors"
                >
                  {copiedKey === generatedKey ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Key
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {/* User Select */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#6b7280] font-mono">User</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f2937] rounded-md py-2.5 px-4 text-white focus:outline-none focus:border-[#1B2F5E] focus:ring-1 focus:ring-[#1B2F5E] font-mono text-sm transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Select user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Expiry Select */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#6b7280] font-mono">Expiration</label>
                    <select
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f2937] rounded-md py-2.5 px-4 text-white focus:outline-none focus:border-[#1B2F5E] focus:ring-1 focus:ring-[#1B2F5E] font-mono text-sm transition-colors appearance-none cursor-pointer"
                    >
                      {EXPIRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reusable Checkbox */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReusable(!reusable)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        reusable 
                          ? 'bg-[#1B2F5E] border-[#1B2F5E]' 
                          : 'bg-[#111827] border-[#1f2937]'
                      }`}
                    >
                      {reusable && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <label className="text-sm text-white font-mono cursor-pointer" onClick={() => setReusable(!reusable)}>
                      Reusable key
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-[#1f2937]">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-[#9ca3af] hover:text-white font-sans text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={actionLoading || !selectedUser}
                    className="px-4 py-2 bg-[#1B2F5E] hover:bg-[#243d7a] text-white rounded-md font-sans text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Generate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
