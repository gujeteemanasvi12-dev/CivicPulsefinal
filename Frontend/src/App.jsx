import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { AnimatePresence, motion } from 'framer-motion'
import { create } from 'zustand'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Building2,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Download,
  FileText,
  Gauge,
  Home,
  Layers,
  MapPin,
  Mic,
  Phone,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Circle, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'

const wardBoundary = [
  [19.0878, 72.8274],
  [19.0988, 72.8392],
  [19.094, 72.8572],
  [19.0782, 72.858],
  [19.0696, 72.8412],
  [19.0748, 72.829],
]

const complaintPins = [
  { id: 1, position: [19.0835, 72.842], category: 'Sanitation', status: 'Assigned', color: '#0f766e' },
  { id: 2, position: [19.0912, 72.8492], category: 'Traffic', status: 'In progress', color: '#f59e0b' },
  { id: 3, position: [19.0764, 72.8376], category: 'Street light', status: 'Filed', color: '#2563eb' },
  { id: 4, position: [19.0867, 72.8543], category: 'Road damage', status: 'Escalated', color: '#dc2626' },
]

const monthlyTrend = [
  { name: 'Jan', complaints: 220, resolved: 172 },
  { name: 'Feb', complaints: 238, resolved: 194 },
  { name: 'Mar', complaints: 204, resolved: 183 },
  { name: 'Apr', complaints: 252, resolved: 211 },
  { name: 'May', complaints: 276, resolved: 236 },
  { name: 'Jun', complaints: 248, resolved: 221 },
]

const backlog = [
  { name: 'Sanitation', count: 42 },
  { name: 'Roads', count: 31 },
  { name: 'Traffic', count: 27 },
  { name: 'Lighting', count: 18 },
]

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'playground', label: 'Playground', icon: SlidersHorizontal },
  { id: 'map', label: 'Dashboard', icon: Layers },
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
]

const screenTitles = {
  login: 'Secure entry',
  ward: 'Choose ward',
  home: 'Home hub',
  report: 'Report a problem',
  pipeline: 'Agent pipeline',
  tracker: 'Complaint tracker',
  playground: 'Policy playground',
  results: 'Results card',
  compare: 'Compare and share',
  map: 'Live complaint map',
  admin: 'Officer dashboard',
  profile: 'Profile and settings',
}

const sliderDefaults = {
  buses: 58,
  calming: 36,
  trees: 42,
  tolls: 18,
}

const complaintSubmitUrl = 'https://civicpulse-backend-6d08.onrender.com/complaint/submit'

const policyWards = [
  {
    id: 'h-west',
    name: 'Mumbai - H West Ward',
    center: [72.842, 19.084],
    zoom: 14.2,
    bounds: [
      [72.8274, 19.0696],
      [72.858, 19.0988],
    ],
  },
  {
    id: 'k-east',
    name: 'Mumbai - K East Ward',
    center: [72.861, 19.113],
    zoom: 13.8,
    bounds: [
      [72.842, 19.096],
      [72.884, 19.132],
    ],
  },
  {
    id: 'g-north',
    name: 'Mumbai - G North Ward',
    center: [72.839, 19.028],
    zoom: 13.8,
    bounds: [
      [72.818, 19.006],
      [72.86, 19.052],
    ],
  },
]

const policyRoads = [
  {
    id: 'mg-road',
    name: 'MG Road',
    type: 'arterial',
    geometry: [
      [72.831, 19.077],
      [72.838, 19.082],
      [72.847, 19.087],
      [72.856, 19.092],
    ],
  },
  {
    id: 'market-street',
    name: 'Market Street',
    type: 'market',
    geometry: [
      [72.833, 19.091],
      [72.841, 19.088],
      [72.85, 19.085],
    ],
  },
  {
    id: 'school-lane',
    name: 'School Lane',
    type: 'residential',
    geometry: [
      [72.836, 19.074],
      [72.841, 19.079],
      [72.846, 19.082],
    ],
  },
]

const policyZones = [
  {
    id: 'bazaar-zone',
    name: 'Bazaar Zone',
    type: 'market-zone',
    geometry: [
      [
        [72.836, 19.085],
        [72.848, 19.084],
        [72.851, 19.091],
        [72.841, 19.096],
        [72.834, 19.091],
        [72.836, 19.085],
      ],
    ],
  },
  {
    id: 'residential-zone',
    name: 'Residential Block',
    type: 'residential-zone',
    geometry: [
      [
        [72.829, 19.073],
        [72.839, 19.071],
        [72.846, 19.079],
        [72.839, 19.086],
        [72.829, 19.081],
        [72.829, 19.073],
      ],
    ],
  },
]

const actionLibrary = {
  arterial: [
    { id: 'bus-lane', label: 'Add bus lane' },
    { id: 'signal', label: 'Add signal' },
    { id: 'footpath', label: 'Widen footpath' },
    { id: 'street-light', label: 'Add street light' },
  ],
  market: [
    { id: 'footpath', label: 'Widen footpath' },
    { id: 'restrict-cars', label: 'Restrict cars' },
    { id: 'bus-stop', label: 'Add bus stop' },
    { id: 'street-light', label: 'Add street light' },
  ],
  residential: [
    { id: 'speed-bumps', label: 'Add speed breaker' },
    { id: 'crossing', label: 'Add crossing' },
    { id: 'street-light', label: 'Add street light' },
  ],
  'market-zone': [
    { id: 'park', label: 'Add small park' },
    { id: 'more-buses', label: 'More bus routes' },
    { id: 'restrict-cars', label: 'Restrict private vehicles' },
    { id: 'street-light', label: 'Add street lights' },
  ],
  'residential-zone': [
    { id: 'park', label: 'Add park' },
    { id: 'more-buses', label: 'More bus routes' },
    { id: 'street-light', label: 'Add street lights' },
  ],
}

const actionOutcomes = {
  'bus-lane': {
    change: 'Added a dedicated bus lane',
    primary: 'Bus commute drops 6 minutes for about 8,000 daily riders',
    tradeoff: 'Car commute increases by about 3 minutes for private vehicle users',
    kind: 'transit',
  },
  signal: {
    change: 'Added a traffic signal',
    primary: 'About 12,000 people cross with shorter waiting gaps each day',
    tradeoff: 'Vehicles may wait one extra signal cycle during peak hours',
    kind: 'safety',
  },
  footpath: {
    change: 'Widened the footpath',
    primary: 'Around 4,500 walkers get safer space during market hours',
    tradeoff: 'One parking row may need to be removed',
    kind: 'safety',
  },
  'restrict-cars': {
    change: 'Restricted private vehicles',
    primary: 'Traffic reduces by about 1,800 vehicles per day in this pocket',
    tradeoff: 'Drivers need to use nearby alternate roads',
    kind: 'congestion',
  },
  'bus-stop': {
    change: 'Added a bus stop',
    primary: 'About 2,200 more riders can catch a bus within 5 minutes',
    tradeoff: 'Kerbside loading space becomes smaller',
    kind: 'transit',
  },
  'speed-bumps': {
    change: 'Added a speed breaker',
    primary: 'About 9 fewer near-misses at this crossing each month',
    tradeoff: 'Two-wheelers and cars move slower on this lane',
    kind: 'safety',
  },
  'street-light': {
    change: 'Added street lighting',
    primary: 'Night safety improves by about 18% for people using this stretch',
    tradeoff: 'The ward needs monthly electricity and maintenance budget',
    kind: 'safety',
  },
  crossing: {
    change: 'Added a marked crossing',
    primary: 'School children get a safer crossing point during rush hour',
    tradeoff: 'Vehicles stop more often near the junction',
    kind: 'safety',
  },
  park: {
    change: 'Added a pocket park',
    primary: 'About 6,000 residents get shade and open space within a short walk',
    tradeoff: 'A small public parking area may be converted',
    kind: 'zone',
  },
  'more-buses': {
    change: 'Added more bus routes',
    primary: 'Buses arrive every 8 minutes instead of long uncertain waits',
    tradeoff: 'Two streets may need dedicated bus stopping space',
    kind: 'transit',
  },
}

const policyStyle = 'https://tiles.openfreemap.org/styles/liberty'

const usePolicyStore = create((set) => ({
  selectedWard: policyWards[0],
  selectedPlace: null,
  bubble: null,
  appliedChanges: [],
  sharedPolicyCode: '',
  shareSnapshot: null,
  setWard: (ward) =>
    set({
      selectedWard: ward,
      selectedPlace: null,
      bubble: null,
      appliedChanges: [],
      shareSnapshot: null,
      sharedPolicyCode: '',
    }),
  setBubble: (bubble) => set({ bubble }),
  clearBubble: () => set({ bubble: null }),
  addChange: (change) =>
    set((state) => ({
      appliedChanges: [...state.appliedChanges, { ...change, id: `${change.placeId}-${change.actionId}-${Date.now()}` }],
      bubble: null,
    })),
  setSharedPolicyCode: (sharedPolicyCode) => set({ sharedPolicyCode }),
  setShareSnapshot: (shareSnapshot) => set({ shareSnapshot }),
}))

function makeMarker(color) {
  return L.divIcon({
    className: '',
    html: `<div class="pulse-marker" style="width:16px;height:16px;background:${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function downloadPolicyReport(score) {
  const impact = describeImpact(score)
  const report = [
    'CivicPulse Policy Playground Report',
    '',
    'Ward: Mumbai - H West Ward',
    'Plan summary: Simple civic improvements selected in the Policy Playground.',
    '',
    'Estimated impact:',
    `- Travel time: ${impact.travel}`,
    `- Clean air: ${impact.air}`,
    `- Civic issues: ${impact.issues}`,
    '',
    'Note: These are early estimates for discussion. Officers should verify with field data before final decisions.',
  ].join('\n')

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'civicpulse-policy-report.txt'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function impactLabel(value) {
  if (value >= 30) return 'Strong'
  if (value >= 18) return 'Good'
  if (value >= 10) return 'Medium'
  return 'Low'
}

function describeImpact(score) {
  return {
    travel: impactLabel(score.commute),
    air: impactLabel(score.pollution),
    issues: impactLabel(score.complaints),
    commuteTime: score.commute >= 15 ? 'Faster' : 'Slight',
    pollutionLevel: score.pollution >= 12 ? 'Cleaner' : 'Mild',
    complaintLevel: score.complaints >= 25 ? 'Fewer' : 'Reduced',
  }
}

function detectComplaint(text, ward) {
  const lower = text.toLowerCase()
  let category = 'General civic issue'
  let routing = 'Ward control room'
  let urgency = 'Medium - needs officer review'

  if (lower.includes('light') || lower.includes('streetlight') || lower.includes('dark')) {
    category = 'Street light'
    routing = 'Electrical maintenance team'
    urgency = 'High - safety issue after dark'
  } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash')) {
    category = 'Sanitation'
    routing = 'Solid waste management team'
    urgency = 'High - public health concern'
  } else if (lower.includes('pothole') || lower.includes('road') || lower.includes('broken')) {
    category = 'Road damage'
    routing = 'Road maintenance team'
    urgency = 'Medium - road repair needed'
  } else if (lower.includes('traffic') || lower.includes('signal') || lower.includes('jam')) {
    category = 'Traffic'
    routing = 'Traffic coordination cell'
    urgency = 'Medium - mobility concern'
  } else if (lower.includes('water') || lower.includes('leak') || lower.includes('drain')) {
    category = 'Water and drainage'
    routing = 'Water and drainage team'
    urgency = 'High - service disruption'
  }

  const locationMatch = text.match(/\b(?:near|at|in|on)\s+([a-z0-9\s.-]{3,45})/i)
  const location = locationMatch ? locationMatch[1].trim() : ward

  return { category, urgency, location, routing }
}

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] }
}

function moveCoordinates(coordinates, ward) {
  const deltaLng = ward.center[0] - 72.842
  const deltaLat = ward.center[1] - 19.084
  return coordinates.map((coordinate) => {
    if (typeof coordinate[0] === 'number') return [coordinate[0] + deltaLng, coordinate[1] + deltaLat]
    return moveCoordinates(coordinate, ward)
  })
}

function buildWardRoads(ward) {
  return policyRoads.map((road) => ({ ...road, geometry: moveCoordinates(road.geometry, ward) }))
}

function buildWardZones(ward) {
  return policyZones.map((zone) => ({ ...zone, geometry: moveCoordinates(zone.geometry, ward) }))
}

function getWardPlace(id, placeType, roads, zones) {
  if (placeType === 'road') return { ...roads.find((item) => item.id === id), placeType: 'road' }
  return { ...zones.find((item) => item.id === id), placeType: 'zone' }
}

function createTrafficDot(map, coordinates, offset, kind) {
  const element = document.createElement('div')
  element.className = 'traffic-dot'
  element.style.background = kind === 'congestion' ? '#f59e0b' : '#2563eb'
  const marker = new maplibregl.Marker({ element }).setLngLat(coordinates[0]).addTo(map)
  let frame = 0

  function animate() {
    if (!marker._map) return
    frame += kind === 'congestion' ? 0.012 : 0.024
    const progress = (frame + offset * 0.18) % 1
    const segmentCount = coordinates.length - 1
    const exact = progress * segmentCount
    const index = Math.min(segmentCount - 1, Math.floor(exact))
    const local = exact - index
    const start = coordinates[index]
    const end = coordinates[index + 1]
    marker.setLngLat([start[0] + (end[0] - start[0]) * local, start[1] + (end[1] - start[1]) * local])
    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
  return marker
}

function createBusMarker(map, coordinates) {
  const element = document.createElement('div')
  element.className = 'flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-[13px] font-bold text-white shadow-lg'
  element.textContent = 'BUS'
  return new maplibregl.Marker({ element }).setLngLat(coordinates[Math.floor(coordinates.length / 2)]).addTo(map)
}

function createSafetyMarker(map, coordinate) {
  const element = document.createElement('div')
  element.className = 'pulse-crossing'
  return new maplibregl.Marker({ element }).setLngLat(coordinate).addTo(map)
}

function App() {
  const [screen, setScreen] = useState('login')
  const [role, setRole] = useState('citizen')
  const [ward, setWard] = useState('Mumbai - H West Ward')
  const [sliders, setSliders] = useState(sliderDefaults)
  const [notify, setNotify] = useState(true)
  const [heatmap, setHeatmap] = useState('All')
  const [currentComplaint, setCurrentComplaint] = useState(null)
  const [complaintHistory, setComplaintHistory] = useState([])

  const policyScore = useMemo(() => {
    const commute = Math.round(18 - sliders.buses * 0.08 + sliders.tolls * 0.04 - sliders.calming * 0.03)
    const pollution = Math.round(14 - sliders.trees * 0.09 - sliders.buses * 0.03 + sliders.tolls * 0.02)
    const complaints = Math.round(22 + sliders.buses * 0.12 + sliders.trees * 0.08 + sliders.calming * 0.05)
    return {
      commute: Math.max(5, commute),
      pollution: Math.max(3, pollution),
      complaints: Math.min(48, complaints),
    }
  }, [sliders])

  const goHome = () => setScreen(role === 'officer' ? 'admin' : 'home')

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7faf8_0%,#eef7f2_36%,#f7f2e9_72%,#f4f6f9_100%)] text-slate-950">
      <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <button className="flex items-center gap-3 text-left" onClick={goHome} type="button">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[linear-gradient(135deg,#12372a,#0f766e,#2563eb)] text-white shadow-sm">
              <Gauge size={22} />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">CivicPulse</span>
              <span className="block text-xs font-medium text-slate-500">Citizen services and policy lab</span>
            </span>
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:flex">
            <MapPin size={16} className="text-[#0f766e]" />
            {ward}
          </div>
          <button
            type="button"
            onClick={() => setScreen('login')}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
          >
            <UserRound size={16} />
            {role === 'officer' ? 'Officer' : 'Citizen'}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-6">
        <aside className="hidden self-start rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-20 lg:block">
          {navItems.map((item) => {
            const Icon = item.icon
            const target = item.id === 'home' && role === 'officer' ? 'admin' : item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScreen(target)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold ${
                  screen === target
                    ? 'bg-[#e7f0ec] text-[#12372a] shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b45309]">CivicPulse</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                {screenTitles[screen]}
              </h1>
            </div>
             </div>
          {screen === 'login' && <LoginScreen role={role} setRole={setRole} next={() => setScreen('ward')} />}
          {screen === 'ward' && <WardScreen ward={ward} setWard={setWard} next={goHome} />}
          {screen === 'home' && <HomeHub setScreen={setScreen} />}
          {screen === 'report' && (
            <ReportComposer
              ward={ward}
              setScreen={setScreen}
              setCurrentComplaint={setCurrentComplaint}
              setComplaintHistory={setComplaintHistory}
            />
          )}
          {screen === 'pipeline' && <PipelineView setScreen={setScreen} complaint={currentComplaint} />}
          {screen === 'tracker' && <Tracker notify={notify} setNotify={setNotify} complaint={currentComplaint} />}
          {screen === 'playground' && (
            <PolicyPlayground sliders={sliders} setSliders={setSliders} score={policyScore} setScreen={setScreen} />
          )}
          {screen === 'results' && <ResultsCard score={policyScore} setScreen={setScreen} />}
          {screen === 'compare' && <CompareShare setScreen={setScreen} />}
          {screen === 'map' && <LiveMap heatmap={heatmap} setHeatmap={setHeatmap} />}
          {screen === 'admin' && <AdminDashboard setScreen={setScreen} />}
          {screen === 'profile' && <ProfileScreen ward={ward} setScreen={setScreen} complaintHistory={complaintHistory} />}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const target = item.id === 'home' && role === 'officer' ? 'admin' : item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScreen(target)}
                className={`flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-semibold ${
                  screen === target ? 'bg-[#e7f0ec] text-[#12372a] ring-1 ring-emerald-100' : 'text-slate-500'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function LoginScreen({ role, setRole, next }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#12372a,#0f766e,#2563eb,#b45309)]" />
        <div className="inline-flex items-center gap-2 rounded-full bg-[#e7f0ec] px-3 py-1 text-sm font-semibold text-[#12372a]">
          <Phone size={16} />
          India-first login
        </div>
        <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          Report civic issues and test better city decisions in one trusted place.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          CivicPulse keeps the first step familiar: phone number, OTP, and a guest option for citizens who want to
          browse or report anonymously before creating an account.
        </p>

        <div className="mt-7 grid gap-3 rounded-lg bg-[linear-gradient(135deg,#f8fafc,#eef7f2)] p-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole('citizen')}
            className={`rounded-md border p-4 text-left ${
              role === 'citizen' ? 'border-[#12372a] bg-white shadow-sm' : 'border-transparent bg-transparent'
            }`}
          >
            <UserRound className="mb-3 text-[#0f766e]" />
            <span className="block font-semibold">I am a citizen</span>
            <span className="text-sm text-slate-500">Report, track, and explore local policies.</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('officer')}
            className={`rounded-md border p-4 text-left ${
              role === 'officer' ? 'border-[#12372a] bg-white shadow-sm' : 'border-transparent bg-transparent'
            }`}
          >
            <Building2 className="mb-3 text-[#b45309]" />
            <span className="block font-semibold">I am an officer</span>
            <span className="text-sm text-slate-500">Manage priority queues and ward analytics.</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-white/70">
        <label className="text-sm font-semibold text-slate-700" htmlFor="phone">
          Mobile number
        </label>
        <div className="mt-2 flex rounded-md border border-slate-200 bg-white">
          <span className="border-r border-slate-200 px-3 py-3 text-slate-500">+91</span>
          <input id="phone" className="min-w-0 flex-1 px-3 py-3 outline-none" placeholder="98765 43210" />
        </div>
        <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="otp">
          OTP
        </label>
        <input id="otp" className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 outline-none" placeholder="Enter 6-digit code" />
        <button
          type="button"
          onClick={next}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#12372a] px-4 py-3 font-semibold text-white shadow-sm hover:bg-[#0f2d23]"
        >
          Continue
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={next}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Continue as guest
        </button>
        <div className="mt-4 rounded-md bg-[#fff7ed] p-3 text-sm text-[#92400e]">
          Admin accounts can later connect through Supabase Auth with Google or Aadhaar-linked verification.
        </div>
      </div>
    </div>
  )
}

function WardScreen({ ward, setWard, next }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-3">
          <Search size={18} className="text-slate-400" />
          <input className="min-w-0 flex-1 outline-none" placeholder="Search city, ward, or pin code" />
        </div>
        <div className="mt-4 grid gap-3">
          <Select label="State" options={['Maharashtra', 'Karnataka', 'Delhi NCR']} />
          <Select label="City" options={['Mumbai', 'Pune', 'Bengaluru']} />
          <Select
            label="Ward or zone"
            value={ward}
            onChange={(event) => setWard(event.target.value)}
            options={['Mumbai - H West Ward', 'Mumbai - K East Ward', 'Mumbai - G North Ward']}
          />
        </div>
        <button
          type="button"
          onClick={next}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#12372a] px-4 py-3 font-semibold text-white"
        >
          Confirm ward
          <Check size={18} />
        </button>
      </div>
      <MapPanel height="420px" showBoundary pins={complaintPins.slice(0, 2)} />
    </div>
  )
}

function HomeHub({ setScreen }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Stat title="Complaints this month" value="248" note="+12% from May" tone="blue" />
        <Stat title="Resolution rate" value="89%" note="Ward average" tone="green" />
        <Stat title="Simulations run" value="1,284" note="By citizens and officers" tone="amber" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <MapPanel height="390px" showBoundary pins={complaintPins} />
        <div className="grid gap-4">
          <ActionCard
            icon={FileText}
            title="Report a problem"
            body="Send text, voice, or photo. CivicPulse extracts category, urgency, and location before filing."
            tone="green"
            onClick={() => setScreen('report')}
          />
          <ActionCard
            icon={SlidersHorizontal}
            title="Play policy maker"
            body="Move simple sliders and see how bus routes, trees, speed calming, and tolls affect your ward."
            tone="blue"
            onClick={() => setScreen('playground')}
          />
        </div>
      </div>
    </div>
  )
}

function ReportComposer({ ward, setScreen, setCurrentComplaint, setComplaintHistory }) {
  const [description, setDescription] = useState('')
  const detected = useMemo(() => detectComplaint(description, ward), [description, ward])
  const [manualFields, setManualFields] = useState(null)
  const hasComplaintText = description.trim().length > 0
  const emptyFields = { category: '', urgency: '', location: '', routing: '' }
  const fields = hasComplaintText ? manualFields || detected : emptyFields
  const canSubmit = description.trim().length > 0

  function updateField(key, value) {
    setManualFields((previous) => ({ ...(previous || detected), [key]: value }))
  }

  function saveComplaint(complaint) {
    setCurrentComplaint(complaint)
    setComplaintHistory((previous) => [complaint, ...previous])
    setScreen('pipeline')
  }

  function makeLocalComplaint() {
    return {
      id: `CP-${Date.now().toString().slice(-5)}`,
      description: description.trim(),
      ...fields,
      ward,
      status: 'Filed',
      department: fields.routing,
      assignedOfficer: fields.routing.includes('Electrical') ? 'A. Patil' : 'Ward duty officer',
      priority: fields.urgency.startsWith('High') ? 'High' : 'Medium',
      priority_score: fields.urgency.startsWith('High') ? 82 : 56,
      summary: `${fields.category} reported at ${fields.location}`,
      officer_message: 'Complaint received and queued for officer review.',
      createdAt: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    }
  }

  async function submitComplaint() {
    if (!canSubmit) {
      setSubmitMessage('Please write your complaint first.')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('Sending complaint to CivicPulse backend...')

    try {
      const response = await fetch(complaintSubmitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          ward,
        }),
      })

      if (!response.ok) throw new Error(`Complaint API failed with ${response.status}`)

      const data = await response.json()
      saveComplaint({
        ...makeLocalComplaint(),
        id: data.complaint_id || makeLocalComplaint().id,
        category: data.category || fields.category,
        department: data.department || fields.routing,
        routing: data.department || fields.routing,
        urgency: data.urgency || fields.urgency,
        location: data.location_hint || fields.location,
        priority: data.priority || makeLocalComplaint().priority,
        priority_score: data.priority_score || makeLocalComplaint().priority_score,
        summary: data.summary || makeLocalComplaint().summary,
        status: data.status || 'Filed',
        officer_email: data.officer_email,
        officer_message: data.officer_message || makeLocalComplaint().officer_message,
        message: data.message,
      })
    } catch (err) {
      console.error('Failed to submit complaint through API.', err)
      setSubmitMessage('Backend did not receive this complaint. Please check if the Render API is awake and CORS is enabled.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Tell us what happened</h2>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setManualFields(null)
            }}
            className="min-h-32 w-full resize-none bg-transparent px-2 py-2 outline-none"
            placeholder="Example: Street light not working near Linking Road. Area is very dark at night."
          />
          <div className="flex items-center justify-end gap-2">
            <button title="Voice input" type="button" className="rounded-full bg-white p-2 text-slate-600 shadow-sm">
            <Mic size={18} />
            </button>
            <button title="Attach photo" type="button" className="rounded-full bg-white p-2 text-slate-600 shadow-sm">
              <Camera size={18} />
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          You can type, erase, and change this before submitting. Fields update live from your text.
        </p>
        <div className="mt-5 rounded-lg border border-slate-200">
          <MapPanel height="300px" pins={complaintPins.slice(0, 1)} draggableLabel="Editable location pin" />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0f766e]">
          <Sparkles size={18} />
          Extracted for confirmation
        </div>
        {!hasComplaintText && (
          <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Write your complaint first. CivicPulse will fill these fields after reading your text.
          </div>
        )}
        {hasComplaintText && (
          <>
            <EditableField label="Category" value={fields.category} onChange={(value) => updateField('category', value)} />
            <EditableField label="Urgency guess" value={fields.urgency} onChange={(value) => updateField('urgency', value)} />
            <EditableField label="Location" value={fields.location} onChange={(value) => updateField('location', value)} />
            <EditableField label="Routing" value={fields.routing} onChange={(value) => updateField('routing', value)} />
          </>
        )}
        <button
          type="button"
          onClick={submitComplaint}
          disabled={isSubmitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#12372a] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit complaint'}
          <Send size={18} />
        </button>
        {submitMessage && <p className="mt-2 text-sm text-slate-500">{submitMessage}</p>}
      </div>
    </div>
  )
}

function PipelineView({ setScreen, complaint }) {
  const steps = [
    ['Understanding', complaint ? `${complaint.category} detected from your report.` : 'Complaint detected from citizen report.'],
    ['Routing', complaint ? `${complaint.routing}, ${complaint.location}.` : 'Ward team selected.'],
    ['Prioritizing', complaint ? complaint.urgency : 'Priority calculated from issue type and location.'],
    ['Drafting', complaint ? `Work order ${complaint.id} prepared for officer review.` : 'Work order prepared for officer review.'],
    ['Scheduling', 'Crew slot suggested for tonight, 8:30 PM.'],
  ]
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3">
        {steps.map(([title, result], index) => (
          <div key={title} className="flex gap-4 rounded-md border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fafc)] p-4 shadow-sm">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${['bg-[#0f766e]', 'bg-[#2563eb]', 'bg-[#b45309]', 'bg-[#7c3aed]', 'bg-[#dc2626]'][index]}`}>
              <Check size={18} />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-slate-600">{result}</p>
            </div>
            <span className="ml-auto hidden text-sm font-semibold text-slate-400 sm:block">Step {index + 1}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setScreen('tracker')}
        className="mt-5 rounded-md bg-[#12372a] px-4 py-3 font-semibold text-white"
      >
        View tracker
      </button>
    </div>
  )
}

function Tracker({ notify, setNotify, complaint }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {complaint && (
          <div className="mb-5 rounded-md bg-[#e7f0ec] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0f766e]">{complaint.id}</p>
            <p className="mt-1 font-semibold text-slate-950">{complaint.description}</p>
            <p className="mt-1 text-sm text-slate-600">
              {complaint.category} at {complaint.location}
            </p>
          </div>
        )}
        {['Filed', 'Assigned', 'In progress', 'Escalated', 'Resolved'].map((item, index) => (
          <div key={item} className="flex gap-3 pb-5 last:pb-0">
            <span className={`mt-1 h-4 w-4 rounded-full ${index < 3 ? 'bg-[#0f766e]' : 'bg-slate-300'}`} />
            <div>
              <p className="font-semibold">{item}</p>
              <p className="text-sm text-slate-500">{index < 3 ? 'Updated today at 10:24 AM' : 'Pending'}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="rounded-md bg-[#fff7ed] p-4">
          <p className="text-sm font-semibold text-[#92400e]">SLA countdown</p>
          <p className="mt-1 text-3xl font-semibold text-[#9a3412]">14h</p>
          <p className="text-sm text-[#92400e]">Escalates automatically if no field update arrives.</p>
        </div>
        <FieldReview label="Assigned officer" value={complaint ? `${complaint.assignedOfficer}, ${complaint.routing}` : 'A. Patil, Electrical Dept.'} />
        <FieldReview label="Last update" value={complaint ? `Complaint filed on ${complaint.createdAt}` : 'Crew accepted work order'} />
        <label className="mt-4 flex items-center justify-between rounded-md border border-slate-200 p-3 font-semibold">
          Notify me
          <input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} />
        </label>
        <button type="button" className="mt-3 w-full rounded-md border border-slate-200 px-4 py-3 font-semibold">
          Comment or nudge
        </button>
      </div>
    </div>
  )
}

const budgetCategories = [
  { id: 'roads', label: 'Roads & potholes', icon: '🚧' },
  { id: 'water', label: 'Water supply', icon: '💧' },
  { id: 'sanitation', label: 'Sanitation', icon: '🗑️' },
  { id: 'streetlights', label: 'Streetlights', icon: '💡' },
  { id: 'parks', label: 'Parks', icon: '🌳' },
]

const playgroundWards = ['Panvel Ward 1', 'Panvel Ward 2', 'Panvel Ward 3', 'Panvel Ward 4', 'Panvel Ward 5']

const TOTAL_BUDGET = 100 // lakhs (₹1 crore)
const BASELINE = 20 // lakhs, default per category

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function scoreFromAllocations(allocations) {
  const d = (id) => allocations[id] - BASELINE
  const safety = clampScore(40 + d('roads') * 0.4 + d('streetlights') * 0.6 + d('sanitation') * 0.1)
  const health = clampScore(40 + d('water') * 0.5 + d('sanitation') * 0.5)
  const mobility = clampScore(40 + d('roads') * 0.6 + d('streetlights') * 0.2)
  const qualityOfLife = clampScore(40 + d('parks') * 0.6 + d('water') * 0.2 + d('sanitation') * 0.2)
  const overall = Math.round((safety + health + mobility + qualityOfLife) / 4)
  return { safety, health, mobility, qualityOfLife, overall }
}

function scoreTier(overall) {
  if (overall >= 70) return 'Great'
  if (overall >= 50) return 'Good'
  return 'Needs work'
}

function buildWardEvents(allocations) {
  const d = (id) => allocations[id] - BASELINE
  return [
    d('roads') >= 5
      ? { icon: '✅', text: 'Roads repaired — fewer bike accidents reported this week' }
      : { icon: '⚠️', text: 'Roads still damaged — bike accidents reported this week' },
    d('water') >= 5
      ? { icon: '✅', text: 'Water supply improved — fewer families rely on tankers' }
      : { icon: '🚱', text: 'Water supply still disrupted — families buying tankers' },
    d('sanitation') >= 5
      ? { icon: '✅', text: 'Daily collection started — overflowing bins cleared faster' }
      : { icon: '🗑️', text: 'Garbage collection irregular — bins overflow for days' },
    d('streetlights') >= 5
      ? { icon: '💡', text: 'Street lights fixed on more roads — night safety improves' }
      : { icon: '🌑', text: 'Streets remain poorly lit at night' },
    d('parks') >= 5
      ? { icon: '🌳', text: 'Park benches restored — more residents visit daily' }
      : { icon: '🥀', text: 'Parks remain neglected, low footfall' },
  ]
}

const budgetCategories = [
  { id: 'roads', label: 'Roads and potholes', icon: '🛣' },
  { id: 'water', label: 'Water supply', icon: '💧' },
  { id: 'sanitation', label: 'Sanitation', icon: '🗑️' },
  { id: 'streetlights', label: 'Streetlights', icon: '💡' },
  { id: 'parks', label: 'Parks', icon: '🌳' },
  { id: 'schools', label: 'Schools and education', icon: '🏫' },
  { id: 'hospitals', label: 'Healthcare centers', icon: '🏥' },
  { id: 'transport', label: 'Public transport', icon: '🚌' },
]

const playgroundWards = [
  'Panvel Ward 1', 'Panvel Ward 2', 'Panvel Ward 3', 'Panvel Ward 4',
  'Kharghar', 'Kamothe', 'New Panvel', 'Ulwe', 'Taloja'
]

const TOTAL_BUDGET = 200
const BASELINE = 25

function clampScore(v) { return Math.max(0, Math.min(100, Math.round(v))) }

function scoreFromAllocations(a) {
  const d = id => (a[id] || 0) - BASELINE
  return {
    safety: clampScore(40 + d('roads') * 0.3 + d('streetlights') * 0.5 + d('sanitation') * 0.1 + d('hospitals') * 0.1),
    health: clampScore(40 + d('water') * 0.4 + d('sanitation') * 0.3 + d('hospitals') * 0.3),
    mobility: clampScore(40 + d('roads') * 0.5 + d('transport') * 0.4 + d('streetlights') * 0.1),
    education: clampScore(40 + d('schools') * 0.7 + d('parks') * 0.2 + d('transport') * 0.1),
    qualityOfLife: clampScore(40 + d('parks') * 0.3 + d('water') * 0.2 + d('sanitation') * 0.2 + d('transport') * 0.15 + d('schools') * 0.15),
  }
}

function scoreTier(s) {
  if (s >= 80) return { label: 'Excellent!', color: '#008300', bg: '#EAF3DE', text: '#173404' }
  if (s >= 65) return { label: 'Good', color: '#2a78d6', bg: '#e6f1fb', text: '#0c447c' }
  if (s >= 45) return { label: 'Needs work', color: '#eda100', bg: '#FAEEDA', text: '#633806' }
  return { label: 'Crisis!', color: '#e34948', bg: '#FCEBEB', text: '#501313' }
}

function buildEvents(a) {
  const d = id => (a[id] || 0) - BASELINE
  return [
    d('roads') >= 5
      ? { good: true, text: 'Roads repaired on MG Road — bike accidents drop 40%' }
      : { good: false, text: 'Roads still damaged — accidents reported this week' },
    d('water') >= 5
      ? { good: true, text: 'Pipeline fixed — 200 flats get 24-hour water supply' }
      : { good: false, text: 'Water supply disrupted — families still buying tankers' },
    d('sanitation') >= 5
      ? { good: true, text: 'Daily garbage collection started — bins cleared in 3 days' }
      : { good: false, text: 'Garbage collection irregular — bins overflowing' },
    d('streetlights') >= 5
      ? { good: true, text: 'Street lights fixed on 12 roads — night safety up 50%' }
      : { good: false, text: 'Dark streets at night — theft reports increasing' },
    d('parks') >= 5
      ? { good: true, text: 'Park benches restored — 400 residents visit daily' }
      : { good: false, text: 'Parks neglected — low footfall, broken benches' },
    d('schools') >= 5
      ? { good: true, text: 'School infrastructure upgraded — enrollment rises 20%' }
      : { good: false, text: 'Schools underfunded — dropout rates remain high' },
    d('hospitals') >= 5
      ? { good: true, text: 'Health center upgraded — 500 more patients served monthly' }
      : { good: false, text: 'Healthcare center understaffed — long queues reported' },
    d('transport') >= 5
      ? { good: true, text: 'New bus routes added — commute time drops 25 minutes' }
      : { good: false, text: 'Public transport inadequate — overcrowded buses daily' },
  ]
}

function downloadReport(ward, allocations, scores, events) {
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const total = Object.values(allocations).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(allocations).sort((a, b) => b[1] - a[1])
  const top2 = sorted.slice(0, 2).map(([id]) => id).join(' and ')
  const tier = scoreTier(scores.overall)
  const names = {
    roads: 'Roads and potholes', water: 'Water supply', sanitation: 'Sanitation',
    streetlights: 'Streetlights', parks: 'Parks', schools: 'Schools and education',
    hospitals: 'Healthcare centers', transport: 'Public transport'
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>CivicPulse Policy Report — ${ward}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 28px;color:#1a1a1a;line-height:1.7}
.bar{height:4px;background:linear-gradient(90deg,#12372a,#2a78d6,#eda100);margin-bottom:28px;border-radius:2px}
.logo{font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#2a78d6;margin-bottom:4px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}
.meta{font-size:13px;color:#666;margin-bottom:24px;font-family:Arial,sans-serif}
.badge{background:#e6f1fb;color:#0c447c;padding:3px 12px;border-radius:20px;font-size:13px;font-family:Arial,sans-serif;font-weight:600}
.score-box{display:flex;align-items:center;gap:20px;background:#f0f7ff;border-left:4px solid #2a78d6;padding:18px 20px;border-radius:0 10px 10px 0;margin:20px 0}
.score-big{font-size:52px;font-weight:700;color:#2a78d6;line-height:1;font-family:Arial,sans-serif}
h2{font-size:15px;font-family:Arial,sans-serif;border-bottom:1.5px solid #e0e0e0;padding-bottom:6px;margin:24px 0 10px;color:#2a78d6}
table{width:100%;border-collapse:collapse;font-size:13px;font-family:Arial,sans-serif}
th{background:#f5f5f5;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#666}
td{padding:8px 12px;border-bottom:1px solid #f0f0f0}
.kpi-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:12px 0}
.kpi{background:#f9f9f9;border:1px solid #e8e8e8;border-radius:8px;padding:12px;text-align:center;font-family:Arial,sans-serif}
.kpi-val{font-size:28px;font-weight:700;color:#2a78d6}
.kpi-lbl{font-size:11px;color:#888;margin-top:2px}
.event{padding:8px 12px;border-left:3px solid #1baf7a;background:#f0faf5;margin-bottom:6px;border-radius:0 4px 4px 0;font-size:13px;font-family:Arial,sans-serif}
.event.bad{border-left-color:#e34948;background:#fff5f5}
footer{margin-top:40px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:11px;color:#aaa;text-align:center;font-family:Arial,sans-serif}
</style></head><body>
<div class="bar"></div>
<div class="logo">Civic<span style="color:#1a1a1a">Pulse</span></div>
<h1>Policy Impact Report</h1>
<p class="meta">${ward} &middot; ${date} &middot; <span class="badge">${tier.label}</span></p>
<div class="score-box">
  <div class="score-big">${scores.overall}<span style="font-size:22px;color:#888;font-weight:400">/100</span></div>
  <div>
    <div style="font-size:17px;font-weight:700;font-family:Arial,sans-serif;margin-bottom:4px">City score: ${tier.label}</div>
    <div style="font-size:13px;color:#555;font-family:Arial,sans-serif">Total budget: ₹${total}L across 8 civic areas</div>
    <div style="font-size:13px;color:#555;font-family:Arial,sans-serif;margin-top:2px">Biggest investment: ${top2}</div>
  </div>
</div>
<h2>Budget allocation</h2>
<table>
<thead><tr><th>Area</th><th>Amount</th><th>Share</th></tr></thead>
<tbody>${sorted.map(([id, val]) => `<tr><td>${names[id] || id}</td><td>₹${val}L</td><td>${total > 0 ? Math.round(val / total * 100) : 0}%</td></tr>`).join('')}</tbody>
</table>
<h2>Projected impact metrics</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-val">${scores.safety}</div><div class="kpi-lbl">Safety (was 40)</div></div>
  <div class="kpi"><div class="kpi-val">${scores.health}</div><div class="kpi-lbl">Health (was 40)</div></div>
  <div class="kpi"><div class="kpi-val">${scores.mobility}</div><div class="kpi-lbl">Mobility (was 40)</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#4a3aa7">${scores.education}</div><div class="kpi-lbl">Education (was 40)</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#1baf7a">${scores.qualityOfLife}</div><div class="kpi-lbl">Quality of life (was 40)</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#eda100">${scores.overall}</div><div class="kpi-lbl">Overall score</div></div>
</div>
<h2>What will happen in ${ward}</h2>
${events.map(e => `<div class="event ${e.good ? '' : 'bad'}">${e.text}</div>`).join('')}
<h2>Analysis</h2>
<p style="font-size:14px">This simulation projects that investing ₹${total}L in ${ward} would raise the city score from <strong>40 to ${scores.overall} out of 100</strong>. The allocation prioritises ${top2}, which deliver the largest improvements over a 3-month window.</p>
<ul style="font-size:14px;margin-left:18px;margin-top:8px">
  <li>Safety: <strong>+${scores.safety - 40} points</strong></li>
  <li>Health: <strong>+${scores.health - 40} points</strong></li>
  <li>Mobility: <strong>+${scores.mobility - 40} points</strong></li>
  <li>Education: <strong>+${scores.education - 40} points</strong></li>
  <li>Quality of life: <strong>+${scores.qualityOfLife - 40} points</strong></li>
</ul>
<footer>CivicPulse &middot; Citizen services and policy lab &middot; ${date}<br>Simulation estimates for citizen discussion. Verify with field data before final decisions.</footer>
</body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `CivicPulse_Policy_Report_${ward.replace(/\s+/g, '_')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function PolicyPlayground() {
  const [ward, setPlaygroundWard] = useState(playgroundWards[2])
  const [allocations, setAllocations] = useState({
    roads: 25, water: 25, sanitation: 25, streetlights: 25,
    parks: 25, schools: 25, hospitals: 25, transport: 25,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const totalSpent = Object.values(allocations).reduce((a, b) => a + b, 0)
  const overBudget = totalSpent > TOTAL_BUDGET
  const remaining = TOTAL_BUDGET - totalSpent

  const rawScores = useMemo(() => scoreFromAllocations(allocations), [allocations])
  const scores = { ...rawScores, overall: Math.round((rawScores.safety + rawScores.health + rawScores.mobility + rawScores.education + rawScores.qualityOfLife) / 5) }
  const tier = scoreTier(scores.overall)
  const events = useMemo(() => buildEvents(allocations), [allocations])

  const chartData = [
    { name: 'Safety', before: 40, after: scores.safety },
    { name: 'Health', before: 40, after: scores.health },
    { name: 'Mobility', before: 40, after: scores.mobility },
    { name: 'Education', before: 40, after: scores.education },
    { name: 'Quality of life', before: 40, after: scores.qualityOfLife },
  ]

  function updateAllocation(id, value) {
    setAllocations(prev => ({ ...prev, [id]: Number(value) }))
  }

  async function submitComplaint() {
    if (overBudget) return
    setIsSubmitting(true)
    setSubmitMessage('')
    const sorted = Object.entries(allocations).sort((a, b) => b[1] - a[1])
    const top2 = sorted.slice(0, 2).map(([id]) => id).join(' and ')
    const desc = `Policy simulation — Be the Mayor. Ward: ${ward}. City score: ${scores.overall}/100 (${tier.label}). Top priorities: ${top2}. Budget: ${Object.entries(allocations).map(([k, v]) => `${k} ₹${v}L`).join(', ')}. Citizen requests urgent attention to these areas.`
    try {
      const res = await fetch(complaintSubmitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, ward }),
      })
      const data = await res.json()
      setSubmitted(true)
      setSubmitMessage(`Submitted! Complaint ID: ${data.complaint_id || 'filed'}`)
    } catch {
      setSubmitMessage('Could not reach backend. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Be the Mayor</h2>
        <p className="mt-1 text-sm text-slate-600">You have ₹2 crore. Allocate across 8 civic areas.</p>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Ward</span>
          <select
            value={ward}
            onChange={e => setPlaygroundWard(e.target.value)}
            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-3 outline-none"
          >
            {playgroundWards.map(w => <option key={w}>{w}</option>)}
          </select>
        </label>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 mb-4">Budget allocation</p>
          <div className="grid gap-4">
            {budgetCategories.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800">{cat.icon} {cat.label}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200">₹{allocations[cat.id]}L</span>
                </div>
                <input
                  type="range" min={0} max={80} step={5}
                  value={allocations[cat.id]}
                  onChange={e => updateAllocation(cat.id, e.target.value)}
                  className="w-full accent-[#12372a]"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="font-semibold text-slate-700">Total spent</span>
            <span className={`font-semibold ${overBudget ? 'text-red-600' : 'text-slate-900'}`}>₹{totalSpent}L / ₹{TOTAL_BUDGET}L</span>
          </div>
          {overBudget
            ? <p className="mt-1 text-sm font-semibold text-red-600">Over budget by ₹{totalSpent - TOTAL_BUDGET}L! Reduce spending.</p>
            : <p className="mt-1 text-sm text-slate-500">₹{remaining}L remaining to allocate</p>
          }
        </div>
      </div>

      <div className="grid gap-4 content-start">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">City score</p>
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 text-center" style={{ borderColor: tier.color }}>
              <span className="text-2xl font-semibold" style={{ color: tier.color }}>{scores.overall}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
            <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: tier.bg, color: tier.text }}>{tier.label}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: 'Safety', val: scores.safety, color: '#2a78d6' },
              { label: 'Health', val: scores.health, color: '#1baf7a' },
              { label: 'Mobility', val: scores.mobility, color: '#eda100' },
              { label: 'Education', val: scores.education, color: '#4a3aa7' },
              { label: 'Quality of life', val: scores.qualityOfLife, color: '#008300' },
            ].map(m => (
              <div key={m.label} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="mt-1 text-xl font-semibold" style={{ color: m.color }}>{m.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">Ward events</p>
          <div className="grid gap-2">
            {events.map((e, i) => (
              <div key={i} className={`rounded-md px-3 py-2 text-sm border-l-4 ${e.good ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-red-50 border-red-400 text-red-900'}`}>
                {e.good ? '✅' : '⚠️'} {e.text}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 mb-3">Before vs after</p>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="before" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Before" />
                <Bar dataKey="after" fill="#0f766e" radius={[4, 4, 0, 0]} name="After" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => downloadReport(ward, allocations, scores, events)}
            className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download size={18} />
            Download policy report
          </button>
          <button
            type="button"
            onClick={submitComplaint}
            disabled={isSubmitting || overBudget || submitted}
            className="flex items-center justify-center gap-2 rounded-md bg-[#12372a] px-4 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {submitted ? <><Check size={18} /> Submitted!</> : isSubmitting ? 'Submitting...' : <><Send size={18} /> Submit to municipality</>}
          </button>
          {submitMessage && <p className="text-sm text-center text-slate-500">{submitMessage}</p>}
        </div>
      </div>
    </div>
  )
}
function ResultsCard({ score, setScreen }) {
  const impact = describeImpact(score)
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Before and after</h2>
        <div className="mt-4 grid gap-3">
          <ResultRow label="Average travel" before="Slow today" after={impact.commuteTime} />
          <ResultRow label="Air quality" before="Needs attention" after={impact.pollutionLevel} />
          <ResultRow label="Repeat complaints" before="Frequent" after={impact.complaintLevel} />
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => downloadPolicyReport(score)}
            className="flex items-center gap-2 rounded-md bg-[#12372a] px-4 py-3 font-semibold text-white"
          >
            <Download size={18} />
            Download
          </button>
          <button type="button" className="flex items-center gap-2 rounded-md border border-slate-200 px-4 py-3 font-semibold">
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#12372a,#0f766e,#2563eb)] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-emerald-100">CivicPulse policy card</p>
        <h2 className="mt-3 text-3xl font-semibold">Safer, greener H West Ward</h2>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <ShareStat label="Travel" value={impact.travel} />
          <ShareStat label="Air" value={impact.air} />
          <ShareStat label="Issues" value={impact.issues} />
        </div>
        <button type="button" onClick={() => setScreen('compare')} className="mt-6 rounded-md bg-white px-4 py-3 font-semibold text-[#12372a]">
          Compare policies
        </button>
      </div>
    </div>
  )
}

function CompareShare({ setScreen }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <CompareCard title="Balanced streets" commute="Good" pollution="Some" complaints="Strong" active />
      <CompareCard title="Transit first" commute="Strong" pollution="Some" complaints="Good" />
      <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-semibold">Diff view</p>
        <p className="mt-1 text-slate-600">Balanced streets reduces more complaints. Transit first reduces more commute time.</p>
        <button type="button" onClick={() => setScreen('playground')} className="mt-4 rounded-md bg-[#12372a] px-4 py-3 font-semibold text-white">
          Try another policy
        </button>
      </div>
    </div>
  )
}

function LiveMap({ heatmap, setHeatmap }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <MapPanel height="620px" showBoundary pins={complaintPins} policyScore={{ commute: 12, pollution: 8, complaints: 18 }} />
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Heatmap category</h2>
        <div className="mt-4 grid gap-2">
          {['All', 'Sanitation', 'Traffic', 'Road damage', 'Street light'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setHeatmap(item)}
              className={`rounded-md border px-3 py-3 text-left font-semibold ${
                heatmap === item ? 'border-[#12372a] bg-[#e7f0ec] text-[#12372a]' : 'border-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ setScreen }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Stat title="Open backlog" value="118" note="Sorted by priority" tone="blue" />
        <Stat title="SLA risk" value="17" note="Need action today" tone="rose" />
        <Stat title="Crews active" value="9" note="Across ward" tone="green" />
        <Stat title="Avg response" value="6.2h" note="This week" tone="amber" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Assigned complaints</h2>
            <button type="button" onClick={() => setScreen('playground')} className="rounded-md bg-[#12372a] px-3 py-2 text-sm font-semibold text-white">
              Simulate policy
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
            {['CP-2048 - Street light outage - High', 'CP-2041 - Garbage overflow - High', 'CP-2029 - Pothole near school - Medium', 'CP-2018 - Signal timing issue - Medium'].map((item) => (
              <div key={item} className="flex items-center justify-between gap-3 border-b border-slate-200 p-3 last:border-b-0">
                <span className="font-medium">{item}</span>
                <span className="rounded-full bg-[#fff7ed] px-2 py-1 text-xs font-semibold text-[#92400e]">Priority</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Ward analytics</h2>
          <div className="mt-4 h-52">
            <ResponsiveContainer>
              <BarChart data={backlog}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 h-44">
            <ResponsiveContainer>
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="resolved" stroke="#0f766e" fill="#d9ede6" />
                <Area type="monotone" dataKey="complaints" stroke="#b45309" fill="#ffedd5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileScreen({ ward, setScreen, complaintHistory = [] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Account</h2>
        <FieldReview label="Mobile" value="+91 98765 43210" />
        <FieldReview label="Current ward" value={ward} />
        <FieldReview label="Complaint history" value={`${complaintHistory.length} filed in this session`} />
        <FieldReview label="Saved policies" value="3 plans" />
        <button type="button" onClick={() => setScreen('ward')} className="mt-4 rounded-md border border-slate-200 px-4 py-3 font-semibold">
          Change ward
        </button>
        {complaintHistory.length > 0 && (
          <div className="mt-4 rounded-md border border-slate-200">
            {complaintHistory.slice(0, 3).map((complaint) => (
              <div key={complaint.id} className="border-b border-slate-200 p-3 last:border-b-0">
                <p className="text-sm font-semibold text-slate-950">{complaint.id} - {complaint.category}</p>
                <p className="text-sm text-slate-500">{complaint.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Notification preferences</h2>
        {['SLA alerts', 'Officer comments', 'Resolved complaints', 'Saved policy updates'].map((item) => (
          <label key={item} className="mt-3 flex items-center justify-between rounded-md border border-slate-200 p-3 font-semibold">
            {item}
            <input type="checkbox" defaultChecked />
          </label>
        ))}
      </div>
    </div>
  )
}

function MapPanel({ height, showBoundary, pins = [], policyScore, draggableLabel }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" style={{ height }}>
      <MapContainer center={[19.084, 72.844]} zoom={14} scrollWheelZoom={false}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {showBoundary && <Polygon positions={wardBoundary} pathOptions={{ color: '#12372a', weight: 2, fillColor: '#0f766e', fillOpacity: 0.08 }} />}
        {policyScore && (
          <>
            <Circle center={[19.086, 72.846]} radius={850 + policyScore.complaints * 10} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.18 }} />
            <Polyline positions={[[19.075, 72.832], [19.082, 72.842], [19.091, 72.854]]} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.72 }} />
            <Polyline positions={[[19.095, 72.835], [19.087, 72.843], [19.079, 72.856]]} pathOptions={{ color: '#0f766e', weight: 4, opacity: 0.68 }} />
          </>
        )}
        {pins.map((pin) => (
          <Marker key={pin.id} position={pin.position} icon={makeMarker(pin.color)}>
            <Popup>
              <strong>{pin.category}</strong>
              <br />
              Status: {pin.status}
            </Popup>
          </Marker>
        ))}
        {draggableLabel && (
          <Marker position={[19.0835, 72.842]} icon={makeMarker('#dc2626')}>
            <Popup>{draggableLabel}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

function Select({ label, options, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select value={value} onChange={onChange} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-3 outline-none">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function Stat({ title, value, note, tone = 'green' }) {
  const tones = {
    green: 'border-t-[#0f766e] bg-[linear-gradient(180deg,#ffffff,#f0fdfa)] text-[#0f766e]',
    blue: 'border-t-[#2563eb] bg-[linear-gradient(180deg,#ffffff,#eff6ff)] text-[#2563eb]',
    amber: 'border-t-[#b45309] bg-[linear-gradient(180deg,#ffffff,#fff7ed)] text-[#b45309]',
    rose: 'border-t-[#dc2626] bg-[linear-gradient(180deg,#ffffff,#fff1f2)] text-[#dc2626]',
  }
  return (
    <div className={`rounded-lg border border-t-4 border-slate-200 p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  )
}

function ActionCard({ icon: Icon, title, body, onClick, tone = 'green' }) {
  const tones = {
    green: 'bg-[#e7f0ec] text-[#12372a] group-hover:bg-[#12372a] group-hover:text-white',
    blue: 'bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white',
  }
  return (
    <button type="button" onClick={onClick} className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#12372a] hover:shadow-md">
      <span className={`flex h-11 w-11 items-center justify-center rounded-md transition ${tones[tone]}`}>
        <Icon size={22} />
      </span>
      <span className="mt-5 block text-2xl font-semibold">{title}</span>
      <span className="mt-2 block leading-7 text-slate-600">{body}</span>
    </button>
  )
}

function FieldReview({ label, value }) {
  return (
    <div className="mt-4 rounded-md border border-slate-200 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function EditableField({ label, value, onChange }) {
  return (
    <label className="mt-4 block rounded-md border border-slate-200 p-3">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent font-semibold text-slate-800 outline-none"
      />
    </label>
  )
}

function MiniMetric({ label, value, tone = 'green' }) {
  const tones = {
    green: 'bg-emerald-50 text-[#0f766e]',
    blue: 'bg-blue-50 text-[#2563eb]',
    amber: 'bg-amber-50 text-[#b45309]',
  }
  return (
    <div className={`rounded-md p-3 ${tones[tone]}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}

function ResultRow({ label, before, after }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-slate-200 p-3">
      <span className="font-semibold">{label}</span>
      <span className="text-sm text-slate-500">{before}</span>
      <span className="rounded-full bg-[#e7f0ec] px-3 py-1 text-sm font-semibold text-[#12372a]">{after}</span>
    </div>
  )
}

function ShareStat({ label, value }) {
  return (
    <div className="rounded-md bg-white/10 p-3">
      <p className="text-sm text-emerald-100">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function CompareCard({ title, commute, pollution, complaints, active }) {
  return (
    <div className={`rounded-lg border p-5 shadow-sm ${active ? 'border-[#12372a] bg-[#e7f0ec]' : 'border-slate-200 bg-white'}`}>
      <p className="text-xl font-semibold">{title}</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniMetric label="Commute" value={commute} tone="blue" />
        <MiniMetric label="Pollution" value={pollution} tone="green" />
        <MiniMetric label="Complaints" value={complaints} tone="amber" />
      </div>
    </div>
  )
}

export default App