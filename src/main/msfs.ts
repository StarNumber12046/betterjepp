import { BrowserWindow } from 'electron'
import {
  open,
  Protocol,
  SimConnectConnection,
  SimConnectDataType,
  SimConnectPeriod,
  SimConnectConstants
} from 'node-simconnect'

export interface AircraftPosition {
  lat: number
  lon: number
  heading: number
}

const DEFINITION_ID = 0
const REQUEST_ID = 0
const UPDATE_FREQ = 5
const FOCUSED_SEND_INTERVAL = 1000 / UPDATE_FREQ
const UNFOCUSED_SEND_INTERVAL = FOCUSED_SEND_INTERVAL / 0.8

class MsfsService {
  private simconnect: SimConnectConnection | null = null
  private mainWindow: BrowserWindow | null = null
  private windowFocused = false
  private georefEnabled = true
  private position: AircraftPosition = { lat: 0, lon: 0, heading: 0 }
  private connected = false
  private lastSendTime = 0
  private connecting = false
  private retryCount = 0
  private maxRetries = 10

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  async start(): Promise<void> {
    this.connect()
  }

  private connect(): void {
    if (this.connecting || this.simconnect) return
    this.connecting = true

    open('BetterJepp MSFS Client', Protocol.FSX_SP2, {
      remote: { host: 'localhost', port: 5111 }
    })
      .then(({ handle }) => {
        this.simconnect = handle
        this.connecting = false
        this.retryCount = 0
        console.log('[MSFS] Connected to SimConnect')
        this.setConnected(true)
        this.setupDataRequest()
      })
      .catch((error) => {
        this.connecting = false
        console.error('[MSFS] Connection failed:', error)
        this.setConnected(false)
        this.retry()
      })
  }

  private retry(): void {
    if (this.retryCount >= this.maxRetries) {
      console.log('[MSFS] Max retries reached, stopping connection attempts')
      return
    }
    this.retryCount++
    const delay = Math.min(this.retryCount * 2000, 30000)
    console.log(
      `[MSFS] Retrying connection in ${delay / 1000}s (attempt ${this.retryCount}/${this.maxRetries})`
    )
    setTimeout(() => this.connect(), delay)
  }

  private setupDataRequest(): void {
    if (!this.simconnect) return

    this.simconnect.addToDataDefinition(
      DEFINITION_ID,
      'PLANE LATITUDE',
      'degrees',
      SimConnectDataType.FLOAT64
    )
    this.simconnect.addToDataDefinition(
      DEFINITION_ID,
      'PLANE LONGITUDE',
      'degrees',
      SimConnectDataType.FLOAT64
    )
    this.simconnect.addToDataDefinition(
      DEFINITION_ID,
      'PLANE HEADING DEGREES TRUE',
      'degrees',
      SimConnectDataType.FLOAT64
    )

    this.simconnect.requestDataOnSimObject(
      REQUEST_ID,
      DEFINITION_ID,
      SimConnectConstants.OBJECT_ID_USER,
      SimConnectPeriod.SIM_FRAME
    )

    this.simconnect.on('simObjectData', (recvData) => {
      if (recvData.requestID !== REQUEST_ID) return

      const buffer = recvData.data
      buffer.setOffset(0)

      try {
        const lat = buffer.readFloat64()
        const lon = buffer.readFloat64()
        const heading = buffer.readFloat64()

        this.position.lat = lat
        this.position.lon = lon
        this.position.heading = heading
      } catch (error) {
        console.error('[MSFS] Error reading position data:', error)
        return
      }

      const now = Date.now()
      const sendInterval = this.windowFocused ? FOCUSED_SEND_INTERVAL : UNFOCUSED_SEND_INTERVAL
      if (now - this.lastSendTime >= sendInterval) {
        this.lastSendTime = now
        this.sendPositionUpdate()
      }
    })
  }

  async stop(): Promise<void> {
    this.maxRetries = 0

    if (this.simconnect) {
      this.simconnect.close()
      this.simconnect = null
    }

    this.setConnected(false)
    console.log('[MSFS] Disconnected')
  }

  setWindowFocused(focused: boolean) {
    this.windowFocused = focused
    if (this.mainWindow) {
      this.mainWindow.webContents.send('window-focused', focused)
    }
  }

  setGeorefEnabled(enabled: boolean) {
    this.georefEnabled = enabled
  }

  isConnected(): boolean {
    return this.connected
  }

  private sendPositionUpdate() {
    if (!this.georefEnabled) return
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('msfs-position', { ...this.position })
    }
  }

  private setConnected(connected: boolean) {
    if (this.connected !== connected) {
      this.connected = connected
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('msfs-connected', connected)
      }
    }
  }
}

export const msfsService = new MsfsService()
