export interface ChartInfo {
  icao: string
  filename: string
  proc_id: string
  chart_type: string
  type_name: string
  category: string
  date_eff: string
  sheet_id: string
  has_tcl: boolean
}

export interface ChartList {
  icao: string
  total: number
  charts: ChartInfo[]
}

export interface ChartType {
  code: string
  type: string
  category: string
}

export interface ChartTypesResponse {
  total: number
  types: ChartType[]
}

export interface Airport {
  icao: string
  iata: string
  name: string
  city: string
  state: string
  country_code: string
  latitude: number
  longitude: number
  timezone: string
  magnetic_variation: number
  longest_runway_ft: number
  airport_use: string
  customs: string
  beacon: boolean
  jet_start_unit: boolean
  fuel_types: string[]
  oxygen: string[]
  repair_types: string[]
}

export interface AirportSearchResult {
  icao: string
  iata: string
  name: string
  city: string
  state: string
  country_code: string
}

export interface AirportSearchResponse {
  total: number
  airports: AirportSearchResult[]
}

export interface HealthResponse {
  [key: string]: string
}

export interface paths {
  '/api/v1/airports/search': {
    get: {
      parameters: {
        query?: {
          q?: string
        }
      }
      responses: {
        200: {
          content: {
            'application/json': AirportSearchResponse
          }
        }
      }
    }
  }
  '/api/v1/airports/{icao}': {
    get: {
      parameters: {
        path: {
          icao: string
        }
      }
      responses: {
        200: {
          content: {
            'application/json': Airport
          }
        }
      }
    }
  }
  '/api/v1/chart-types': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': ChartTypesResponse
          }
        }
      }
    }
  }
  '/api/v1/charts/{icao}': {
    get: {
      parameters: {
        path: {
          icao: string
        }
        query?: {
          type?: string
          search?: string
        }
      }
      responses: {
        200: {
          content: {
            'application/json': ChartList
          }
        }
      }
    }
  }
  '/api/v1/charts/{icao}/export/{filename}': {
    get: {
      parameters: {
        path: {
          icao: string
          filename: string
        }
        query?: {
          no_postprocess?: number
        }
      }
      responses: {
        200: {
          content: {
            'application/pdf': Blob
          }
        }
      }
    }
  }
  '/health': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': HealthResponse
          }
        }
      }
    }
  }
}
