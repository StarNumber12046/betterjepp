import { BrowserWindow } from 'electron'
import { createSocket, Socket } from 'dgram'

export interface AircraftPosition {
  lat: number
  lon: number
  heading: number
}

const DATAREFS = [
  'sim/flightmodel/position/latitude',
  'sim/flightmodel/position/longitude',
  'sim/flightmodel/position/psi'
]

const UPDATE_FREQ = 5

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
  private connectionTimeout: NodeJS.Timeout | null = null

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
    if (!this.socket || !this.georefEnabled) return

    DATAREFS.forEach((dataref, index) => {
      const buf = this.createRrefRequest(UPDATE_FREQ, index, dataref)
      this.socket!.send(buf, 0, buf.length, this.sendPort, '127.0.0.1', (err) => {
        if (err) {
          console.error(`[XPlane] Failed to subscribe to ${dataref}:`, err)
        } else {
          console.log(`[XPlane] Subscribed to ${dataref}`)
        }
      })
    })
  }

  private unsubscribeDatarefs() {
    if (!this.socket) return

    DATAREFS.forEach((dataref, index) => {
      const buf = this.createRrefRequest(0, index, dataref)
      this.socket!.send(buf, 0, buf.length, this.sendPort, '127.0.0.1')
    })
  }

  private createRrefRequest(freq: number, index: number, dataref: string): Buffer {
    const datarefBytes = Buffer.from(dataref, 'utf8')
    const buf = Buffer.alloc(5 + 4 + 4 + datarefBytes.length + 1)

    buf.write('RREF\0', 0, 5, 'ascii')
    buf.writeInt32LE(freq, 5)
    buf.writeInt32LE(index, 9)
    datarefBytes.copy(buf, 13)
    buf.write('\0', 13 + datarefBytes.length)

    return buf
  }

  private handleMessage(msg: Buffer) {
    if (!this.windowFocused) return

    const header = msg.toString('ascii', 0, 4)
    if (header !== 'RREF') return

    for (let offset = 5; offset + 8 <= msg.length; offset += 8) {
      const index = msg.readInt32LE(offset)
      const value = msg.readFloatLE(offset + 4)

      switch (index) {
        case 0:
          this.position.lat = value
          break
        case 1:
          this.position.lon = value
          break
        case 2:
          this.position.heading = value
          break
      }
    }

    this.lastUpdateTime = Date.now()
    this.setConnected(true)
    this.sendPositionUpdate()
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
