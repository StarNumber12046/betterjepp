import ky from 'ky'

export interface SimBriefAirport {
  icao_code: string
  name: string
  pos: string
  runwy: string
  elev: string
  tranLv: string
  tranHg: string
}

export interface SimBriefAircraft {
  icaocode: string
  name: string
  iatacode: string
  reg: string
  fin: string
  selcal: string
  typelite: string
}

export interface SimBriefTimes {
  est_out: string
  est_in: string
  est_on: string
  est_off: string
  sched_out: string
  sched_in: string
  sched_on: string
  sched_off: string
  block_time: string
  flight_time: string
  trip_time: string
}

export interface SimBriefGeneral {
  flight_number: string
  route: string
  cruise_altitude: string
  cruise_tas: string
  cruise_mach: string
  distance: string
  air_distance: string
  etops: string
  vnas: string
}

export interface SimBriefAlternate {
  icao_code: string
  name: string
  pos: string
  runwy: string
  elev: string
}

export interface SimBriefOFP {
  origin: SimBriefAirport
  destination: SimBriefAirport
  alternates: SimBriefAlternate[]
  aircraft: SimBriefAircraft
  times: SimBriefTimes
  general: SimBriefGeneral
  params: {
    user_id: string
  }
  atc: {
    callsign: string | null
  }
}

const simbriefApi = ky.extend({
  prefixUrl: 'https://www.simbrief.com/api/',
  timeout: 10000
})

export async function fetchSimBriefOfp(pilotId: string): Promise<SimBriefOFP> {
  const response = await simbriefApi.get('xml.fetcher.php', {
    searchParams: {
      userid: pilotId,
      json: '1'
    }
  })

  return response.json<SimBriefOFP>()
}
