import { useState, useEffect } from 'react'
import { Video, Calendar, Search, Play, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { getNodes, isConfigured } from '../../api/headscale'

function PlaybackPage() {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState('')
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [fetchingRecordings, setFetchingRecordings] = useState(false)
  const [playbackUrl, setPlaybackUrl] = useState('')
  const [recordings, setRecordings] = useState([])
  const [dvrBrand, setDvrBrand] = useState('hikvision')
  const [streams, setStreams] = useState({})
  const [selectedStream, setSelectedStream] = useState('')
  const [fetchingStreams, setFetchingStreams] = useState(false)
  const [dvrIP, setDvrIP] = useState('')
  const [currentStreamName, setCurrentStreamName] = useState('')
  const [currentGo2rtcIP, setCurrentGo2rtcIP] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')

  
  const cameras = [
    { id: 1, name: 'Camera 1', trackId: 101 },
    { id: 2, name: 'Camera 2', trackId: 201 },
    { id: 3, name: 'Camera 3', trackId: 301 },
    { id: 4, name: 'Camera 4', trackId: 401 },
    { id: 5, name: 'Camera 5', trackId: 501 },
    { id: 6, name: 'Camera 6', trackId: 601 },
    { id: 7, name: 'Camera 7', trackId: 701 },
    { id: 8, name: 'Camera 8', trackId: 801 },
    { id: 9, name: 'Camera 9', trackId: 901 },
  ]

  const fetchNodes = async () => {
    if (!isConfigured()) {
      setError('Headscale API not configured.')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await getNodes()
      const transformedNodes = data.map(node => ({
        id: node.id,
        name: node.givenName || node.name,
        ip: node.ipAddresses?.[0] || 'N/A',
        status: node.online ? 'online' : 'offline',
      })).filter(node => node.status === 'online')
      setNodes(transformedNodes)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodes()
  }, [])

  useEffect(() => {
    return () => {
      recordings.forEach(async (r) => {
        await fetch(`http://${r.go2rtcIP}:1984/api/streams?name=${r.streamName}`, { method: 'DELETE' })
      })
    }
  }, [recordings])

  // Fetch streams from go2rtc when node is selected
  const fetchStreams = async (nodeIP) => {
    if (!nodeIP) return
    setFetchingStreams(true)
    setStreams({})
    setSelectedStream('')
    setDvrIP('')
    setError(null)
    try {
      const res = await fetch(`http://${nodeIP}:1984/api/streams`)
      if (!res.ok) throw new Error('Failed to fetch streams from device')
      const data = await res.json()
      setStreams(data)
    } catch (err) {
      setError(`Could not reach go2rtc on ${nodeIP}:1984 — is the device online?`)
    } finally {
      setFetchingStreams(false)
    }
  }

  // Extract DVR IP from RTSP URL in stream config
  const extractDvrIP = (streamName) => {
    const stream = streams[streamName]
    if (!stream || !stream.producers || !stream.producers[0]) return ''
    const rtspUrl = stream.producers[0].url
    try {
      // Split on last @ to handle passwords containing @
      const afterLastAt = rtspUrl.split('@').pop()
      const ip = afterLastAt.split('/')[0].split(':')[0]
      return ip
    } catch {
      return ''
    }
  }

  const handleStopPlayback = async () => {
    if (currentStreamName && currentGo2rtcIP) {
      await fetch(`http://${currentGo2rtcIP}:1984/api/streams?name=${currentStreamName}`, { method: 'DELETE' })
      setCurrentStreamName('')
      setCurrentGo2rtcIP('')
    }
    setPlaybackUrl('')
  }

  const handleNodeChange = (nodeIP) => {
    setSelectedNode(nodeIP)
    setSelectedStream('')
    setDvrIP('')
    setPlaybackUrl('')
    setSelectedCamera('')
    fetchStreams(nodeIP)
  }

  const handleStreamChange = (streamName) => {
    setSelectedStream(streamName)
    const stream = streams[streamName]
    if (!stream || !stream.producers || !stream.producers[0]) return
    const rtspUrl = stream.producers[0].url

    // Extract DVR IP
    const afterLastAt = rtspUrl.split('@').pop()
    const ip = afterLastAt.split('/')[0].split(':')[0]
    setDvrIP(ip)

    // Extract channel number from URL (Channels/101 → 1, Channels/201 → 2)
    const channelMatch = rtspUrl.match(/Channels\/(\d+)/)
    if (channelMatch) {
      const trackId = parseInt(channelMatch[1])
      const camera = cameras.find(c => c.trackId === trackId)
      if (camera) setSelectedCamera(String(camera.id))
    }

    // Also handle tracks format (tracks/101)
    const trackMatch = rtspUrl.match(/tracks\/(\d+)/)
    if (trackMatch) {
      const trackId = parseInt(trackMatch[1])
      const camera = cameras.find(c => c.trackId === trackId)
      if (camera) setSelectedCamera(String(camera.id))
    }

    // Auto detect brand
    if (rtspUrl.includes('Streaming/tracks') || rtspUrl.includes('Streaming/Channels')) {
      setDvrBrand('hikvision')
    } else if (rtspUrl.includes('cam/') || rtspUrl.includes('playback')) {
      setDvrBrand('dahua')
    }
  }

  const toHikvisionTime = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const toDahuaTime = (d) => d.toISOString().replace('T', '_').replace(/:/g, '_').split('.')[0].replace(/-/g, '_')

  const handleFetchRecordings = async () => {
    // Cleanup previous stream before starting new one
    if (currentStreamName && currentGo2rtcIP) {
      await fetch(`http://${currentGo2rtcIP}:1984/api/streams?name=${currentStreamName}`, { method: 'DELETE' })
      setCurrentStreamName('')
      setCurrentGo2rtcIP('')
    }

    if (!selectedNode || !selectedStream || !selectedCamera || !selectedDate || !dvrIP) {
      setError('Please complete all fields')
      return
    }

    setFetchingRecordings(true)
    setError(null)
    setPlaybackUrl('')

    try {
      const camera = cameras.find(c => c.id === parseInt(selectedCamera))
      const streamName = `playback_cam${selectedCamera}_${Date.now()}`
      // const start = new Date(`${selectedDate}T00:00:00Z`)
      // const end = new Date(`${selectedDate}T23:59:59Z`)
      const start = new Date(`${selectedDate}T${startTime}:00Z`)
      const end = new Date(`${selectedDate}T${endTime}:59Z`)

      const hikvisionUrl = `rtsp://admin:Ulteam@2016@${dvrIP}/Streaming/tracks/${camera.trackId}/?starttime=${toHikvisionTime(start)}&endtime=${toHikvisionTime(end)}#video=copy#media=video`
      const dahuaUrl = `ffmpeg:rtsp://admin:Admin1234@${dvrIP}:554/cam/playback?channel=${selectedCamera}&starttime=${toDahuaTime(start)}&endtime=${toDahuaTime(end)}#transport=tcp`
      const rtspUrl = dvrBrand === 'hikvision' ? hikvisionUrl : dahuaUrl

      const go2rtcIP = selectedNode
      const registerRes = await fetch(
        `http://${go2rtcIP}:1984/api/streams?name=${streamName}&src=${encodeURIComponent(rtspUrl)}`,
        { method: 'PUT' }
      )

      if (!registerRes.ok) throw new Error('Failed to register stream with go2rtc')
      const playbackMode = dvrBrand === 'hikvision' ? '#webrtc' : ''
      setPlaybackUrl(`http://${go2rtcIP}:1984/stream.html?src=${streamName}${playbackMode}`)
      // setPlaybackUrl(`http://${go2rtcIP}:1984/${playbackMode}.html?src=${streamName}`)
      // setPlaybackUrl(`http://${go2rtcIP}:1984/stream.html?src=${streamName}&mode=webrtc`)
      setCurrentGo2rtcIP(go2rtcIP)
      setCurrentStreamName(streamName)
      setRecordings(prev => [...prev, { url: rtspUrl, date: selectedDate, streamName, go2rtcIP }])

    } catch (err) {
      setError(err.message)
    } finally {
      setFetchingRecordings(false)
    }
  }

  return (
    <div>
      {/* <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-2">Playback</h1>
      </div> */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">Playback</h1>
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

      <div className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          {/* Device */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Device</label>
            <select
              value={selectedNode}
              onChange={(e) => handleNodeChange(e.target.value)}
              disabled={loading || nodes.length === 0}
              className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
            >
              <option value="">Select device...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.ip}>{node.name} ({node.ip})</option>
              ))}
            </select>
          </div>

          {/* Stream / DVR IP */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">
              DVR Source {fetchingStreams && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
            </label>
            <select
              value={selectedStream}
              onChange={(e) => handleStreamChange(e.target.value)}
              disabled={!selectedNode || fetchingStreams || Object.keys(streams).length === 0}
              className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">
                {fetchingStreams ? 'Fetching sources...' : Object.keys(streams).length === 0 && selectedNode ? 'No sources found' : 'Select DVR source...'}
              </option>
              {/* {Object.keys(streams).map((name) => (
                <option key={name} value={name}>
                  {name} {extractDvrIP(name) ? `(${extractDvrIP(name)})` : ''}
                </option>
              ))} */}
              {Object.keys(streams)
                .filter(name => !name.startsWith('playback_'))
                .map((name) => (
                  <option key={name} value={name}>
                    {name} {extractDvrIP(name) ? `(${extractDvrIP(name)})` : ''}
                  </option>
                ))
              }
            </select>
          </div>

          {/* DVR Brand - auto detected but overridable */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">DVR Brand</label>
            <select
              value={dvrBrand}
              onChange={(e) => setDvrBrand(e.target.value)}
              disabled={!selectedStream}
              className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="hikvision">Hikvision | Prama</option>
              <option value="cpplus">CP Plus | Dahua</option>
            </select>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Camera */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              disabled={!selectedStream}
              className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">Select camera...</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>{camera.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-muted-foreground-dark pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                disabled={!selectedStream || !selectedCamera}
                className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 pl-10 pr-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!selectedStream || !selectedCamera}
              className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* End Time */}
          {/* <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark mb-2">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!selectedStream || !selectedCamera}
              className="w-full bg-input dark:bg-input-dark border border-border dark:border-border-dark rounded-md py-2 px-4 text-foreground dark:text-foreground-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div> */}

          {/* Fetch Button */}
          <div className="flex items-end">
            <button
              onClick={handleFetchRecordings}
              disabled={!selectedNode || !selectedStream || !selectedCamera || !selectedDate || !startTime || fetchingRecordings}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2 px-4 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetchingRecordings ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Fetching...</>
              ) : (
                <><Search className="w-4 h-4" />Fetch</>
              )}
            </button>
          </div>

          {/* <div className="border-b border-border dark:border-border-dark p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground dark:text-foreground-dark">Recording Playback</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  Camera {selectedCamera} • {selectedDate} • {dvrIP}
                </p>
              </div>
            </div>
            <button
              onClick={handleStopPlayback}
              className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-md py-1.5 px-3 text-sm transition-colors"
            >
              Stop
            </button>
          </div> */}

        </div>
      </div>

      {/* Playback Player */}
      {playbackUrl && (
        <div className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg overflow-hidden">
          {/* <div className="border-b border-border dark:border-border-dark p-4 flex items-center gap-3">
            <Play className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium text-foreground dark:text-foreground-dark">Recording Playback</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                Camera {selectedCamera} • {selectedDate} • {dvrBrand === 'hikvision' ? 'Hikvision / Prama' : 'Dahua / CP Plus'} • {dvrIP}
              </p>
            </div>
          </div> */}
          <div className="border-b border-border dark:border-border-dark p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground dark:text-foreground-dark">Recording Playback</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  Camera {selectedCamera} • {selectedDate} • {dvrBrand === 'hikvision' ? 'Hikvision / Prama' : 'Dahua / CP Plus'} • {dvrIP}
                </p>
              </div>
            </div>
            <button
              onClick={handleStopPlayback}
              className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-md py-1.5 px-3 text-sm transition-colors"
            >
              Stop
            </button>
          </div>
          <div className="relative bg-black aspect-video">
            <iframe
              src={playbackUrl}
              className="w-full h-full"
              allow="autoplay"
              title="DVR Playback"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!playbackUrl && !fetchingRecordings && (
        <div className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg p-12 text-center">
          <Video className="w-16 h-16 mx-auto text-muted-foreground dark:text-muted-foreground-dark mb-4" />
          <h3 className="text-lg font-medium text-foreground dark:text-foreground-dark mb-2">No Recording Selected</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Select a device, camera, and date above to view recorded footage
          </p>
        </div>
      )}
    </div>
  )
}

export default PlaybackPage