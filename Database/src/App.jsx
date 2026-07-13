import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

const DEMO_COMPLAINTS = [
  { id: 'DEMO01', summary: 'Critical pothole on highway causing accidents near Sector 7 Kharghar.', category: 'Roads', ward: 'Kharghar', priority: 'Critical', priority_score: 92, status: 'Filed' },
  { id: 'DEMO02', summary: 'Water supply disrupted for 200 flats for 3+ days in Panvel Ward 2.', category: 'Water', ward: 'Panvel Ward 2', priority: 'Critical', priority_score: 88, status: 'In Progress' },
  { id: 'DEMO03', summary: 'Broken streetlight on MG Road creating safety hazard for 2 months.', category: 'Streetlights', ward: 'Panvel Ward 1', priority: 'High', priority_score: 71, status: 'Filed' },
  { id: 'DEMO04', summary: '10-day garbage backlog in Kamothe Sector 20 creating health hazard.', category: 'Sanitation', ward: 'Kamothe', priority: 'High', priority_score: 80, status: 'Escalated' },
  { id: 'DEMO05', summary: 'Open sewage drain overflowing onto road in New Panvel residential area.', category: 'Sanitation', ward: 'New Panvel', priority: 'Critical', priority_score: 95, status: 'In Progress' },
  { id: 'DEMO06', summary: 'Sector 12 park in Kharghar neglected with broken infrastructure.', category: 'Parks', ward: 'Kharghar', priority: 'Medium', priority_score: 42, status: 'Filed' },
  { id: 'DEMO07', summary: 'Late night noise from club disturbing sleep in Panvel Ward 3.', category: 'Noise', ward: 'Panvel Ward 3', priority: 'Medium', priority_score: 48, status: 'Filed' },
  { id: 'DEMO08', summary: 'Contaminated brown water supply in Panvel Ward 4 causing health concerns.', category: 'Water', ward: 'Panvel Ward 4', priority: 'High', priority_score: 82, status: 'Resolved' },
  { id: 'DEMO09', summary: 'Daily 3-hour power outage in Kamothe Sector 5 for over a week.', category: 'Electricity', ward: 'Kamothe', priority: 'High', priority_score: 68, status: 'In Progress' },
  { id: 'DEMO10', summary: 'Road requires complete relaying after poor post-monsoon repair work.', category: 'Roads', ward: 'Panvel Ward 3', priority: 'High', priority_score: 74, status: 'Filed' },
]

const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' }
const STATUS_COLORS = { Filed: '#6b7280', 'In Progress': '#3b82f6', Escalated: '#ef4444', Resolved: '#22c55e' }
const CATEGORY_COLORS = {
  Roads: '#f97316', Water: '#3b82f6', Sanitation: '#a855f7',
  Electricity: '#eab308', Streetlights: '#06b6d4', Parks: '#22c55e', Noise: '#ec4899'
}

export default function App() {
  const [complaints, setComplaints] = useState(DEMO_COMPLAINTS)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [wardFilter, setWardFilter] = useState('All')
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    setLoading(true)
   fetch('https://civicpulse-backend-6d08.onrender.com/complaints/all')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setComplaints(data)
          setIsLive(true)
        }
      })
      .catch(() => {
        console.log('Using demo data — backend not connected')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = complaints.filter(c => {
    const statusMatch = filter === 'All' || c.status === filter
    const categoryMatch = categoryFilter === 'All' || c.category === categoryFilter
    const wardMatch = wardFilter === 'All' || c.ward === wardFilter
    return statusMatch && categoryMatch && wardMatch
  })

  const categoryData = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Streetlights', 'Parks', 'Noise'].map(cat => ({
    name: cat,
    count: complaints.filter(c => c.category === cat).length,
    fill: CATEGORY_COLORS[cat]
  })).filter(d => d.count > 0)

  const statusData = ['Filed', 'In Progress', 'Escalated', 'Resolved'].map(s => ({
    name: s,
    value: complaints.filter(c => c.status === s).length
  })).filter(d => d.value > 0)

  const resolved = complaints.filter(c => c.status === 'Resolved').length
  const critical = complaints.filter(c => c.priority === 'Critical').length
  const escalated = complaints.filter(c => c.status === 'Escalated').length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      {/* Live indicator */}
      {loading && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full z-50">
          🔄 Fetching live data...
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🏛️ CivicPulse Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Panvel Municipal Corporation — Live Grievance Overview</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">Data source</p>
          <p className={`text-sm font-medium ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
            {isLive ? '🟢 Live from Neo4j' : '🟡 Demo data'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-600 transition">
          <p className="text-gray-400 text-sm mb-1">Total Complaints</p>
          <p className="text-4xl font-bold text-white">{complaints.length}</p>
          <p className="text-gray-500 text-xs mt-2">All time</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-red-800 hover:border-red-600 transition">
          <p className="text-gray-400 text-sm mb-1">🔴 Critical</p>
          <p className="text-4xl font-bold text-red-400">{critical}</p>
          <p className="text-gray-500 text-xs mt-2">Needs immediate action</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-orange-800 hover:border-orange-600 transition">
          <p className="text-gray-400 text-sm mb-1">🟠 Escalated</p>
          <p className="text-4xl font-bold text-orange-400">{escalated}</p>
          <p className="text-gray-500 text-xs mt-2">Sent to senior officer</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-green-800 hover:border-green-600 transition">
          <p className="text-gray-400 text-sm mb-1">🟢 Resolved</p>
          <p className="text-4xl font-bold text-green-400">{resolved}</p>
          <p className="text-gray-500 text-xs mt-2">Successfully closed</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-1">Complaints by Category</h2>
          <p className="text-gray-500 text-xs mb-4">Distribution across departments</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-1">Status Breakdown</h2>
          <p className="text-gray-500 text-xs mb-4">Current resolution status</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={3}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={Object.values(STATUS_COLORS)[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '8px' }} />
              <Legend formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Filters */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
        <div className="flex gap-2 items-center mb-3">
          <span className="text-gray-500 text-xs w-20 shrink-0">Status:</span>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Filed', 'In Progress', 'Escalated', 'Resolved'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {s} {s !== 'All' && `(${complaints.filter(c => c.status === s).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center mb-3">
          <span className="text-gray-500 text-xs w-20 shrink-0">Category:</span>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Roads', 'Water', 'Sanitation', 'Electricity', 'Streetlights', 'Parks', 'Noise'].map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-gray-500 text-xs w-20 shrink-0">Ward:</span>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Kharghar', 'Kamothe', 'New Panvel', 'Panvel Ward 1', 'Panvel Ward 2', 'Panvel Ward 3', 'Panvel Ward 4'].map(ward => (
              <button key={ward} onClick={() => setWardFilter(ward)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${wardFilter === ward ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {ward}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Complaints Log</h2>
          <span className="text-gray-500 text-sm">{filtered.length} showing</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-5 py-3 text-gray-400 font-medium">ID</th>
              <th className="px-5 py-3 text-gray-400 font-medium">Summary</th>
              <th className="px-5 py-3 text-gray-400 font-medium">Category</th>
              <th className="px-5 py-3 text-gray-400 font-medium">Ward</th>
              <th className="px-5 py-3 text-gray-400 font-medium">Priority</th>
              <th className="px-5 py-3 text-gray-400 font-medium">Score</th>
              <th className="px-5 py-3 text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">No complaints match your filters</td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                  <td className="px-5 py-3 font-mono text-gray-500 text-xs">{c.id}</td>
                  <td className="px-5 py-3 text-gray-300 max-w-xs truncate">{c.summary}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: CATEGORY_COLORS[c.category] + '22', color: CATEGORY_COLORS[c.category] }}>
                      {c.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{c.ward}</td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-xs" style={{ color: PRIORITY_COLORS[c.priority] }}>{c.priority}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.priority_score}%`, background: PRIORITY_COLORS[c.priority] }} />
                      </div>
                      <span className="text-xs text-gray-400">{c.priority_score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: STATUS_COLORS[c.status] + '33', color: STATUS_COLORS[c.status] }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}