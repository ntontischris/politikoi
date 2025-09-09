import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

interface MonthlyData {
  month: string
  citizens: number
  requests: number
  military: number
}

interface StatusData {
  name: string
  value: number
  color: string
}

interface StatisticsChartProps {
  type: 'line' | 'pie' | 'bar'
  data: MonthlyData[] | StatusData[]
  title: string
  height?: number
}

const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({ 
  type, 
  data, 
  title,
  height = 300
}) => {
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data as MonthlyData[]}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="citizens" 
          stroke={COLORS.blue} 
          strokeWidth={2}
          dot={{ fill: COLORS.blue, strokeWidth: 2, r: 4 }}
          name="Πολίτες"
        />
        <Line 
          type="monotone" 
          dataKey="requests" 
          stroke={COLORS.green} 
          strokeWidth={2}
          dot={{ fill: COLORS.green, strokeWidth: 2, r: 4 }}
          name="Αιτήματα"
        />
        <Line 
          type="monotone" 
          dataKey="military" 
          stroke={COLORS.yellow} 
          strokeWidth={2}
          dot={{ fill: COLORS.yellow, strokeWidth: 2, r: 4 }}
          name="Στρατιωτικό"
        />
      </LineChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data as StatusData[]}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
        >
          {(data as StatusData[]).map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data as MonthlyData[]}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="citizens" 
          fill={COLORS.blue}
          radius={[4, 4, 0, 0]}
          name="Πολίτες"
        />
        <Bar 
          dataKey="requests" 
          fill={COLORS.green}
          radius={[4, 4, 0, 0]}
          name="Αιτήματα"
        />
        <Bar 
          dataKey="military" 
          fill={COLORS.yellow}
          radius={[4, 4, 0, 0]}
          name="Στρατιωτικό"
        />
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="w-full">
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'bar' && renderBarChart()}
      </div>
    </div>
  )
}