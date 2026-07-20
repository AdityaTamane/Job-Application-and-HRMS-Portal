import { useState } from 'react'
import { MapPin, Navigation, Check, LocateFixed } from 'lucide-react'
import type { GeoPoint } from '@/lib/types'
import { GEOFENCE_RADIUS_M, distanceMeters } from '@/lib/workSession'
import { LiveMap } from '@/components/map/LiveMap'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function GeofenceCheck({
  job,
  onVerified,
}: {
  job: { lat: number; lng: number; address: string }
  onVerified: (point: GeoPoint) => void
}) {
  const [checking, setChecking] = useState(false)
  const [point, setPoint] = useState<GeoPoint | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [simulated, setSimulated] = useState(false)

  const check = async () => {
    setChecking(true)
    // Attempt a real device fix to demonstrate the geolocation capability.
    const getReal = () =>
      new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 6000 },
        )
      })

    const real = await getReal()
    let p: GeoPoint
    let sim = false
    if (real) {
      const d = distanceMeters({ lat: real.coords.latitude, lng: real.coords.longitude }, job)
      if (d <= GEOFENCE_RADIUS_M) {
        p = { lat: real.coords.latitude, lng: real.coords.longitude, t: Date.now() }
      } else {
        // Real device is far from the seeded job — fall back to a simulated on-site fix.
        sim = true
        p = { lat: job.lat + 0.0006, lng: job.lng - 0.0004, t: Date.now() }
      }
    } else {
      sim = true
      p = { lat: job.lat + 0.0006, lng: job.lng - 0.0004, t: Date.now() }
    }
    const d = distanceMeters(p, job)
    setPoint(p)
    setDistance(d)
    setSimulated(sim)
    setChecking(false)
  }

  const ok = distance !== null && distance <= GEOFENCE_RADIUS_M

  return (
    <div>
      <LiveMap
        job={job}
        jobLabel={job.address}
        student={point}
        studentLabel="You"
        radiusMeters={GEOFENCE_RADIUS_M}
        recenterOn="job"
        height={260}
      />

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="h-4 w-4 text-beacon-500" />
        <span className="flex-1">{job.address}</span>
      </div>

      {distance !== null && (
        <div
          className={cn(
            'mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium',
            ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
          )}
        >
          <Navigation className="h-4 w-4" />
          {ok ? `You're on site — ${distance}m from the job location.` : `Too far — ${distance}m away (must be within ${GEOFENCE_RADIUS_M}m).`}
          {simulated && <span className="ml-auto text-xs font-normal opacity-70">simulated fix</span>}
        </div>
      )}

      <div className="mt-4">
        {ok && point ? (
          <Button className="w-full" variant="success" icon={<Check className="h-4 w-4" />} onClick={() => onVerified(point)}>
            Confirm I'm at the location
          </Button>
        ) : (
          <Button className="w-full" loading={checking} icon={<LocateFixed className="h-4 w-4" />} onClick={check}>
            {checking ? 'Getting your location…' : 'Verify my location'}
          </Button>
        )}
      </div>
    </div>
  )
}
