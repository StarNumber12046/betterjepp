import { useState, useEffect } from 'react'
import { Save, FolderOpen, Check, Loader2, Activity, Download, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGeorefStore } from '@/stores/georefStore'
import { getApiBaseUrl } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export function SettingsPanel() {
  const settings = useSettingsStore((s) => s.settings)
  const setApiUrl = useSettingsStore((s) => s.setApiUrl)
  const setSimbriefPilotId = useSettingsStore((s) => s.setSimbriefPilotId)
  const setExportDir = useSettingsStore((s) => s.setExportDir)
  const setGeorefEnabled = useSettingsStore((s) => s.setGeorefEnabled)
  const setXplaneSendPort = useSettingsStore((s) => s.setXplaneSendPort)
  const setXplaneListenPort = useSettingsStore((s) => s.setXplaneListenPort)
  const xplaneConnected = useGeorefStore((s) => s.xplaneConnected)

  const [apiUrl, setApiUrlLocal] = useState(settings.apiUrl)
  const [pilotId, setPilotIdLocal] = useState(settings.simbriefPilotId)
  const [exportDir, setExportDirLocal] = useState(settings.exportDir)
  const [georefEnabled, setGeorefEnabledLocal] = useState(settings.georefEnabled)
  const [xplaneSendPort, setXplaneSendPortLocal] = useState(settings.xplaneSendPort)
  const [xplaneListenPort, setXplaneListenPortLocal] = useState(settings.xplaneListenPort)
  const [saved, setSaved] = useState(false)
  const [selectingDir, setSelectingDir] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{
    available: boolean
    version?: string
    error?: string
  } | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)

  useEffect(() => {
    setApiUrlLocal(settings.apiUrl)
    setPilotIdLocal(settings.simbriefPilotId)
    setExportDirLocal(settings.exportDir)
    setGeorefEnabledLocal(settings.georefEnabled)
    setXplaneSendPortLocal(settings.xplaneSendPort)
    setXplaneListenPortLocal(settings.xplaneListenPort)
  }, [settings])

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/health`)
        const ver: string = (await res.json()).version.split('.')
        if (parseInt(ver[0]) >= 2 && parseInt(ver[1]) >= 1) {
          setIsConnected(true)
        } else {
          setIsConnected(false)
          alert('Please update the API to version 2.1 or later.')
        }
      } catch {
        setIsConnected(false)
      }
    }
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.api.onUpdateDownloaded(() => setUpdateDownloaded(true))
  }, [])

  const handleSave = async () => {
    setApiUrl(apiUrl)
    setSimbriefPilotId(pilotId)
    setExportDir(exportDir)
    setGeorefEnabled(georefEnabled)
    setXplaneSendPort(xplaneSendPort)
    setXplaneListenPort(xplaneListenPort)
    await window.api.saveSettings({
      apiUrl,
      simbriefPilotId: pilotId,
      exportDir,
      georefEnabled,
      xplaneSendPort,
      xplaneListenPort
    })
    if (georefEnabled) {
      await window.api.setXplanePorts(xplaneSendPort, xplaneListenPort)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSelectDir = async () => {
    setSelectingDir(true)
    try {
      const dir = await window.api.selectDirectory()
      if (dir) {
        setExportDirLocal(dir)
      }
    } finally {
      setSelectingDir(false)
    }
  }

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true)
    setUpdateInfo(null)
    try {
      const result = await window.api.checkForUpdates()
      setUpdateInfo(result)
    } catch (error) {
      setUpdateInfo({ available: false, error: String(error) })
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleDownloadUpdate = async () => {
    setDownloading(true)
    try {
      const result = await window.api.downloadUpdate()
      if (!result.success) {
        setUpdateInfo({ available: true, error: result.error })
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleInstallUpdate = () => {
    window.api.installUpdate()
  }

  const hasChanges =
    apiUrl !== settings.apiUrl ||
    pilotId !== settings.simbriefPilotId ||
    exportDir !== settings.exportDir ||
    georefEnabled !== settings.georefEnabled ||
    xplaneSendPort !== settings.xplaneSendPort ||
    xplaneListenPort !== settings.xplaneListenPort

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">Settings</h2>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity
            className={`w-4 h-4 ${
              isConnected === null
                ? 'text-muted-foreground'
                : isConnected
                  ? 'text-green-500'
                  : 'text-red-500'
            }`}
          />
          <span className="text-sm">
            {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md">
        <div className="space-y-2">
          <label className="text-sm font-medium">API URL</label>
          <Input
            value={apiUrl}
            onChange={(e) => setApiUrlLocal(e.target.value)}
            placeholder="http://localhost:8080"
          />
          <p className="text-xs text-muted-foreground">The base URL for the chart API server</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">SimBrief Pilot ID</label>
          <Input
            value={pilotId}
            onChange={(e) => setPilotIdLocal(e.target.value)}
            placeholder="Your SimBrief Pilot ID"
          />
          <p className="text-xs text-muted-foreground">
            Find your Pilot ID in SimBrief Account Settings
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">Export Directory</label>
          <div className="flex gap-2">
            <Input
              value={exportDir}
              onChange={(e) => setExportDirLocal(e.target.value)}
              placeholder="Select a directory..."
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={handleSelectDir} disabled={selectingDir}>
              {selectingDir ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Charts will be exported to {'{dir}/{ICAO}/{chart_name}.pdf'}
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Georeferencing</h3>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="georef-enabled"
              checked={georefEnabled}
              onChange={(e) => setGeorefEnabledLocal(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="georef-enabled" className="text-sm">
              Enable Georeferencing
            </label>
          </div>

          {georefEnabled && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">XPlane Send Port</label>
                <Input
                  type="number"
                  value={xplaneSendPort}
                  onChange={(e) => setXplaneSendPortLocal(parseInt(e.target.value) || 49000)}
                  placeholder="49000"
                />
                <p className="text-xs text-muted-foreground">
                  Port to send RREF requests to XPlane (default: 49000)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">XPlane Listen Port</label>
                <Input
                  type="number"
                  value={xplaneListenPort}
                  onChange={(e) => setXplaneListenPortLocal(parseInt(e.target.value) || 49001)}
                  placeholder="49001"
                />
                <p className="text-xs text-muted-foreground">
                  Port to receive RREF responses from XPlane (default: 49001)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    xplaneConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm">
                  {xplaneConnected ? 'Connected to XPlane' : 'XPlane not connected'}
                </span>
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={!hasChanges}>
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          {hasChanges && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">About</h3>
          <p className="text-xs text-muted-foreground">
            BetterJepp - A flight simulation chart viewer with SimBrief integration.
          </p>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Updates</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckUpdates}
              disabled={checkingUpdate}
            >
              {checkingUpdate ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check for Updates
            </Button>
          </div>
          {updateInfo?.available && (
            <div className="space-y-2">
              <p className="text-xs text-green-500">Update {updateInfo.version} available!</p>
              {updateDownloaded ? (
                <Button size="sm" onClick={handleInstallUpdate}>
                  Install and Restart
                </Button>
              ) : (
                <Button size="sm" onClick={handleDownloadUpdate} disabled={downloading}>
                  {downloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download Update
                </Button>
              )}
            </div>
          )}
          {updateInfo && !updateInfo.available && !updateInfo.error && (
            <p className="text-xs text-muted-foreground">You&apos;re up to date!</p>
          )}
          {updateInfo?.error && <p className="text-xs text-red-500">Error: {updateInfo.error}</p>}
        </div>
      </div>
    </div>
  )
}
