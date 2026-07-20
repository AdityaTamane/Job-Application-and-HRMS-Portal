import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GeoPoint } from '@/lib/types'

export interface LatLng {
  lat: number
  lng: number
}

function divIcon(emoji: string, bg: string) {
  return L.divIcon({
    className: 'lh-marker',
    html: `<div style="background:${bg};width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff"><span style="transform:rotate(45deg);font-size:16px">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  })
}

const JOB_ICON = divIcon('📍', '#f18f0c')
const STUDENT_ICON = divIcon('🧑‍🔧', '#2f63ad')

/** Keeps the map centred on the moving point. */
function Recenter({ point }: { point: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([point.lat, point.lng], map.getZoom(), { animate: true })
  }, [point.lat, point.lng, map])
  return null
}

export function LiveMap({
  job,
  jobLabel,
  student,
  studentLabel,
  radiusMeters,
  trail,
  height = 360,
  recenterOn = 'student',
}: {
  job: LatLng
  jobLabel?: string
  student?: LatLng | null
  studentLabel?: string
  radiusMeters?: number
  trail?: GeoPoint[]
  height?: number
  recenterOn?: 'student' | 'job'
}) {
  const center = recenterOn === 'student' && student ? student : job
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={16} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {radiusMeters && (
          <Circle center={[job.lat, job.lng]} radius={radiusMeters} pathOptions={{ color: '#2f63ad', fillColor: '#2f63ad', fillOpacity: 0.08 }} />
        )}
        <Marker position={[job.lat, job.lng]} icon={JOB_ICON}>
          <Popup>{jobLabel ?? 'Job location'}</Popup>
        </Marker>
        {student && (
          <Marker position={[student.lat, student.lng]} icon={STUDENT_ICON}>
            <Popup>{studentLabel ?? 'Pro location'}</Popup>
          </Marker>
        )}
        {trail && trail.length > 1 && (
          <Polyline positions={trail.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: '#2f63ad', weight: 3, opacity: 0.6 }} />
        )}
        {student && <Recenter point={recenterOn === 'student' ? student : job} />}
      </MapContainer>
    </div>
  )
}
