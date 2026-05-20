import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, RefreshCw, AlertCircle, Play, X, Check, Loader2 } from 'lucide-react'
import { getNodes, isConfigured } from '../../api/headscale'

const BRANDS = [
  { label: 'Hikvision / Prama', value: 'hikvision' },
  { label: 'Dahua / CP Plus', value: 'dahua' },
]

const buildRtspUrl = ({ brand, ip, port, channel, username, password }) => {
  if (brand === 'hikvision') {
    const trackId = (parseInt(channel) - 1) * 100 + 101
    return `rtsp://${username}:${password}@${ip}:${port}/Streaming/Channels/${trackId}`
  } else {
    return `rtsp://${username}:${password}@${ip}:${port}/cam/realmonitor?channel=${channel}&subtype=0`
  }
}

function ConfigurationPage({ user }) {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState('')
  const [streams, setStreams] = useState({})
  const [fetchingStreams, setFetchingStreams] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [previewStream, setPreviewStream] = useState(null)
  const [form, setForm] = useState({
    name: '', brand: 'hikvision', ip: '', port: '554',
    channel: '1', username: 'admin', password: ''
  })

  const fetchNodes = async () => {
    if (!isConfigured()) { setLoading(false); return }
    try {
      setLoading(true)
      const data = await getNodes(user?.headscaleUser)
      const transformed = data.map(node => ({
        id: node.id,
        name: node.givenName || node.name,
        ip: node.ipAddresses?.[0] || 'N/A',
        status: node.online ? 'online' : 'offline',
      })).filter(n => n.status === 'online')
      setNodes(transformed)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStreams = async (nodeIP) => {
    if (!nodeIP) return
    setFetchingStreams(true)
    setStreams({})
    setError(null)
    try {
      const res = await fetch(`http://${nodeIP}:1984/api/streams`)
      if (!res.ok) throw new Error('Failed to fetch streams')
      const data = await res.json()
      // Filter out playback streams
      const filtered = Object.fromEntries(
        Object.entries(data).filter(([name]) => !name.startsWith('playback_'))
      )
      setStreams(filtered)
    } catch (err) {
      setError(`Could not reach go2rtc on ${nodeIP}:1984`)
    } finally {
      setFetchingStreams(false)
    }
  }

  useEffect(() => { fetchNodes() }, [user])

  const handleNodeChange = (nodeIP) => {
    setSelectedNode(nodeIP)
    setPreviewStream(null)
    fetchStreams(nodeIP)
  }

  const extractStreamInfo = (streamName) => {
    const stream = streams[streamName]
    if (!stream?.producers?.[0]) return {}
    const url = stream.producers[0].url
    const afterLastAt = url.split('@').pop()
    const ip = afterLastAt.split('/')[0].split(':')[0]
    const port = afterLastAt.split('/')[0].split(':')[1] || '554'
    return { ip, port, url }
  }

  const handleAdd = async () => {
    if (!form.name || !form.ip || !form.password) {
      setError('Name, IP and password are required')
      return
    }
    setActionLoading(true)
    setError(null)
    try {
      const rtspUrl = buildRtspUrl(form)
      const res = await fetch(
        `http://${selectedNode}:1984/api/streams?name=${form.name}&src=${encodeURIComponent(rtspUrl)}`,
        { method: 'PUT' }
      )
      if (!res.ok) throw new Error('Failed to add stream')
      await fetchStreams(selectedNode)
      setPreviewStream(form.name)
      setAddModal(false)
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!form.name || !form.ip || !form.password) {
      setError('Name, IP and password are required')
      return
    }
    setActionLoading(true)
    setError(null)
    try {
      // Delete old stream first
      await fetch(`http://${selectedNode}:1984/api/streams?name=${editModal}`, { method: 'DELETE' })
      const rtspUrl = buildRtspUrl(form)
      const res = await fetch(
        `http://${selectedNode}:1984/api/streams?name=${form.name}&src=${encodeURIComponent(rtspUrl)}`,
        { method: 'PUT' }
      )
      if (!res.ok) throw new Error('Failed to update stream')
      await fetchStreams(selectedNode)
      setPreviewStream(form.name)
      setEditModal(null)
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await fetch(`http://${selectedNode}:1984/api/streams?name=${deleteConfirm}`, { method: 'DELETE' })
      if (previewStream === deleteConfirm) setPreviewStream(null)
      await fetchStreams(selectedNode)
      setDeleteConfirm(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (streamName) => {
    const { ip, port } = extractStreamInfo(streamName)
    const stream = streams[streamName]
    const url = stream?.producers?.[0]?.url || ''
    const brand = url.includes('Streaming/Channels') ? 'hikvision' : 'dahua'
    const channelMatch = url.match(/Channels\/(\d+)/)
    const trackId = channelMatch ? parseInt(channelMatch[1]) : 101
    const channel = String(Math.floor((trackId - 1) / 100) + 1)
    const credMatch = url.match(/rtsp:\/\/([^:]+):(.+)@/)
    setForm({
      name: streamName,
      brand,
      ip: ip || '',
      port: port || '554',
      channel,
      username: credMatch?.[1] || 'admin',
      password: credMatch ? url.split('@')[0].split(':').slice(2).join(':') : ''
    })
    setEditModal(streamName)
  }

  const resetForm = () => {
    setForm({ name: '', brand: 'hikvision', ip: '', port: '554', channel: '1', username: 'admin', password: '' })
  }

  const inputClass = "w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">Stream Configuration</h1>
        <button
          onClick={() => selectedNode && fetchStreams(selectedNode)}
          disabled={!selectedNode || fetchingStreams}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:hover:text-foreground-dark hover:bg-secondary dark:hover:bg-secondary-dark rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${fetchingStreams ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Device Selector */}
      <div className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Device</label>
            <select
              value={selectedNode}
              onChange={(e) => handleNodeChange(e.target.value)}
              disabled={loading || nodes.length === 0}
              className={inputClass}
            >
              <option value="">Select device...</option>
              {nodes.map(node => (
                <option key={node.id} value={node.ip}>{node.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { resetForm(); setAddModal(true); setError(null) }}
              disabled={!selectedNode}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Stream
            </button>
          </div>
        </div>
      </div>

      {/* Streams Table */}
      {selectedNode && (
        <div className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg overflow-hidden mb-6">
          {fetchingStreams ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Fetching streams...</span>
            </div>
          ) : Object.keys(streams).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground-dark text-sm">
              No streams configured on this device
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-border-dark bg-secondary/50 dark:bg-secondary-dark/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">Stream Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">DVR IP</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(streams).map(name => {
                  const { ip } = extractStreamInfo(name)
                  const isActive = streams[name]?.producers?.[0]?.id !== undefined
                  return (
                    <tr key={name} className="border-b border-border dark:border-border-dark last:border-0 hover:bg-secondary/30 dark:hover:bg-secondary-dark/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-foreground dark:text-foreground-dark">{name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground dark:text-muted-foreground-dark">{ip || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded ${isActive ? 'bg-green-500/20 text-green-500' : 'bg-muted dark:bg-muted-dark text-muted-foreground dark:text-muted-foreground-dark'}`}>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {isActive ? 'Active' : 'Idle'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewStream(previewStream === name ? null : name)}
                            className="p-2 text-muted-foreground dark:text-muted-foreground-dark hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Preview"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(name)}
                            className="p-2 text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:hover:text-foreground-dark hover:bg-secondary dark:hover:bg-secondary-dark rounded-md transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(name)}
                            className="p-2 text-muted-foreground dark:text-muted-foreground-dark hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Live Preview */}
      {previewStream && (
        <div className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg overflow-hidden">
          <div className="border-b border-border dark:border-border-dark p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground dark:text-foreground-dark">Live Preview</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{previewStream}</p>
              </div>
            </div>
            <button
              onClick={() => setPreviewStream(null)}
              className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-md py-1.5 px-3 text-sm transition-colors"
            >
              Stop
            </button>
          </div>
          <div className="relative bg-black aspect-video">
            <iframe
              src={`http://${selectedNode}:1984/stream.html?src=${previewStream}`}
              className="w-full h-full"
              allow="autoplay"
              title="Live Preview"
            />
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <StreamModal
          title="Add Stream"
          form={form}
          setForm={setForm}
          onConfirm={handleAdd}
          onClose={() => { setAddModal(false); resetForm() }}
          actionLoading={actionLoading}
          inputClass={inputClass}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <StreamModal
          title={`Edit Stream — ${editModal}`}
          form={form}
          setForm={setForm}
          onConfirm={handleEdit}
          onClose={() => { setEditModal(null); resetForm() }}
          actionLoading={actionLoading}
          inputClass={inputClass}
          isEdit
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="Delete Stream" onClose={() => setDeleteConfirm(null)}>
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-md p-3">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              This action cannot be undone.
            </div>
            <p className="text-sm text-foreground dark:text-foreground-dark">
              Are you sure you want to delete stream <strong>{deleteConfirm}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:text-foreground-dark transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={actionLoading} className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50">
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StreamModal({ title, form, setForm, onConfirm, onClose, actionLoading, inputClass, isEdit }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Stream Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isEdit}
              className={inputClass}
              placeholder="e.g. cam1, office_entrance"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Brand</label>
            <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass}>
              {BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">DVR IP</label>
            <input type="text" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} className={inputClass} placeholder="192.168.1.x" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Port</label>
            <input type="text" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} className={inputClass} placeholder="554" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Channel</label>
            <input type="number" min="1" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Username</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Enter password" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:text-foreground-dark transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={actionLoading} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
            {actionLoading ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save' : 'Add Stream')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">{title}</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground dark:text-muted-foreground-dark hover:text-foreground dark:text-foreground-dark transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default ConfigurationPage