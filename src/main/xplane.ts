import { BrowserWindow } from 'electron'
import { createSocket, Socket } from 'dgram'

export interface AircraftPosition {
  lat: number
  lon: number
  heading: number
}

const DATAREFS = [
  { path: 'sim/flightmodel/position/latitude', index: 1 },
  { path: 'sim/flightmodel/position/longitude', index: 1 },
  { path: 'sim/flightmodel/position/psi', index: 1 }
]

const UPDATE_FREQ = 5
const FOCUSED_SEND_INTERVAL = 1000 / UPDATE_FREQ
const UNFOCUSED_SEND_INTERVAL = FOCUSED_SEND_INTERVAL / 0.8

class XPlaneService {
  private socket: Socket | null = null
  private mainWindow: BrowserWindow | null = null
  private sendPort = 49000
  private listenPort = 49001
  private windowFocused = false
  private georefEnabled = true
  private position: AircraftPosition = { lat: 0, lon: 0, heading: 0 }
  private connected = false
  private lastUpdateTime = 0
  private lastSendTime = 0
  private connectionTimeout: NodeJS.Timeout | null = null
  private subscribed = false

  constructor() {
    this.handleMessage = this.handleMessage.bind(this)
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  async start(sendPort: number, listenPort: number): Promise<void> {
    this.sendPort = sendPort
    this.listenPort = listenPort

    if (this.socket) {
      await this.stop()
    }

    this.socket = createSocket('udp4')

    return new Promise((resolve) => {
      this.socket!.on('message', this.handleMessage)
      this.socket!.on('error', (err) => {
        console.error('[XPlane] Socket error:', err)
        this.setConnected(false)
      })

      this.socket!.bind(this.listenPort, () => {
        console.log(`[XPlane] Listening on port ${this.listenPort}`)
        this.subscribeDatarefs()
        this.startConnectionWatchdog()
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    if (this.socket) {
      this.unsubscribeDatarefs()

      return new Promise((resolve) => {
        this.socket!.close(() => {
          console.log('[XPlane] Socket closed')
          this.socket = null
          this.setConnected(false)
          resolve()
        })
      })
    }
  }

  setWindowFocused(focused: boolean) {
    this.windowFocused = focused
    if (this.mainWindow) {
      this.mainWindow.webContents.send('window-focused', focused)
    }
  }

  setGeorefEnabled(enabled: boolean) {
    this.georefEnabled = enabled
    if (enabled && this.socket) {
      this.subscribeDatarefs()
    } else if (!enabled && this.socket) {
      this.unsubscribeDatarefs()
    }
  }

  async updatePorts(sendPort: number, listenPort: number): Promise<void> {
    const needsRestart = sendPort !== this.sendPort || listenPort !== this.listenPort
    this.sendPort = sendPort
    this.listenPort = listenPort

    if (needsRestart && this.socket) {
      await this.start(sendPort, listenPort)
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  private subscribeDatarefs() {
    if (!this.socket || !this.georefEnabled || this.subscribed) return
    this.subscribed = true

    DATAREFS.forEach(({ path, index }) => {
      const buf = this.createRrefRequest(UPDATE_FREQ, index, path)
      this.socket!.send(buf, 0, buf.length, this.sendPort, '127.0.0.1', (err) => {
        if (err) {
          console.error(`[XPlane] Failed to subscribe to ${path}:`, err)
        }
      })
    })
  }

  private unsubscribeDatarefs() {
    if (!this.socket) return
    this.subscribed = false

    DATAREFS.forEach(({ path, index }) => {
      const buf = this.createRrefRequest(0, index, path)
      this.socket!.send(buf, 0, buf.length, this.sendPort, '127.0.0.1')
    })
  }

  private createRrefRequest(freq: number, index: number, dataref: string): Buffer {
    const DATAREF_FIELD_SIZE = 400
    const datarefBytes = Buffer.from(dataref, 'utf8')
    const buf = Buffer.alloc(5 + 4 + 4 + DATAREF_FIELD_SIZE)

    buf.write('RREF\0', 0, 5, 'ascii')
    buf.writeInt32LE(freq, 5)
    buf.writeInt32LE(index, 9)
    datarefBytes.copy(buf, 13)
    buf.write('\0', 13 + datarefBytes.length)

    return buf
  }

  private handleMessage(msg: Buffer) {
    const header = msg.toString('ascii', 0, 4)
    if (header !== 'RREF') return

    const values: number[] = []
    for (let offset = 5; offset + 8 <= msg.length; offset += 8) {
      const value = msg.readFloatLE(offset + 4)
      values.push(value)
    }

    if (values.length >= 1) this.position.lat = values[0]
    if (values.length >= 2) this.position.lon = values[1]
    if (values.length >= 3) this.position.heading = values[2]

    this.lastUpdateTime = Date.now()
    this.setConnected(true)

    const now = Date.now()
    const sendInterval = this.windowFocused ? FOCUSED_SEND_INTERVAL : UNFOCUSED_SEND_INTERVAL
    if (now - this.lastSendTime >= sendInterval) {
      this.lastSendTime = now
      this.sendPositionUpdate()
    }
  }

  private sendPositionUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('xplane-position', { ...this.position })
    }
  }

  private setConnected(connected: boolean) {
    if (this.connected !== connected) {
      this.connected = connected
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('xplane-connected', connected)
      }
    }
  }

  private startConnectionWatchdog() {
    const checkConnection = () => {
      const now = Date.now()
      if (this.connected && now - this.lastUpdateTime > 3000) {
        this.setConnected(false)
      }
      this.connectionTimeout = setTimeout(checkConnection, 1000)
    }
    checkConnection()
  }
}

export const xplaneService = new XPlaneService()
