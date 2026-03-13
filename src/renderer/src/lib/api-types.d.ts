/**
 * Hand-maintained OpenAPI types for the Marinvent Chart API.
 *
 * Note: openapi-typescript@7.x does not support Swagger 2.0, so we cannot
 * auto-generate from the backend's /swagger/doc.json. This file must be
 * manually kept in sync with the API schema.
 */

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
  is_vfr: boolean
}

export interface ChartBounds {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface GeoRefStatus {
  georeferenced: boolean
  bounds: ChartBounds
}

export interface CoordToPixelRequest {
  latitude: number
  longitude: number
}

export interface CoordToPixelResponse {
  x: number
  y: number
  error?: string
}

export interface BatchCoordToPixelRequest {
  points: CoordToPixelRequest[]
}

export interface BatchCoordToPixelResponse {
  points: CoordToPixelResponse[]
}

export interface PixelToCoordRequest {
  x: number
  y: number
}

export interface PixelToCoordResponse {
  latitude: number
  longitude: number
  error?: string
}

export interface BatchPixelToCoordRequest {
  points: PixelToCoordRequest[]
}

export interface BatchPixelToCoordResponse {
  points: PixelToCoordResponse[]
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
  '/api/v1/charts/{icao}/geo/status/{filename}': {
    get: {
      parameters: {
        path: {
          icao: string
          filename: string
        }
      }
      responses: {
        200: {
          content: {
            'application/json': GeoRefStatus
          }
        }
      }
    }
  }
  '/api/v1/charts/{icao}/geo/coord2pixel/{filename}': {
    post: {
      parameters: {
        path: {
          icao: string
          filename: string
        }
      }
      requestBody: {
        content: {
          'application/json': CoordToPixelRequest
        }
      }
      responses: {
        200: {
          content: {
            'application/json': CoordToPixelResponse
          }
        }
      }
    }
  }
  '/api/v1/charts/{icao}/geo/pixel2coord/{filename}': {
    post: {
      parameters: {
        path: {
          icao: string
          filename: string
        }
      }
      requestBody: {
        content: {
          'application/json': PixelToCoordRequest
        }
      }
      responses: {
        200: {
          content: {
            'application/json': PixelToCoordResponse
          }
        }
      }
    }
  }
  '/api/v1/charts/{icao}/geo/batch-coord2pixel/{filename}': {
    post: {
      parameters: {
        path: {
          icao: string
          filename: string
        }
      }
      requestBody: {
        content: {
          'application/json': BatchCoordToPixelRequest
        }
      }
      responses: {
        200: {
          content: {
            'application/json': BatchCoordToPixelResponse
          }
        }
      }
    }
  }
  '/api/v1/charts/{icao}/geo/batch-pixel2coord/{filename}': {
    post: {
      parameters: {
        path: {
          icao: string
          filename: string
        }
      }
      requestBody: {
        content: {
          'application/json': BatchPixelToCoordRequest
        }
      }
      responses: {
        200: {
          content: {
            'application/json': BatchPixelToCoordResponse
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
