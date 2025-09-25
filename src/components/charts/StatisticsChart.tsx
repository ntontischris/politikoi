import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Bar,
  Legend
} from 'recharts'
import { useResponsive, useTouchDevice } from '../../hooks/useResponsive'

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
  mobileHeight?: number
  aspectRatio?: number // Width/height ratio for responsive sizing
  minHeight?: number
  maxHeight?: number
  showLegend?: boolean
  interactive?: boolean
  className?: string
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
  height = 300,
  mobileHeight = 250,
  aspectRatio = 2, // Default 2:1 aspect ratio
  minHeight = 200,
  maxHeight = 500,
  showLegend = false,
  interactive = true,
  className = ''
}) => {
  const { isMobile, isTablet, currentBreakpoint } = useResponsive()
  const { isTouchDevice } = useTouchDevice()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  // Responsive height calculation based on container width and aspect ratio
  const calculateResponsiveHeight = useCallback(() => {
    if (!containerRef.current) return height

    const containerWidth = containerRef.current.clientWidth
    let calculatedHeight = containerWidth / aspectRatio

    // Apply min/max constraints
    calculatedHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight))

    // Apply mobile/tablet specific heights if provided
    if (isMobile && mobileHeight) {
      calculatedHeight = Math.min(calculatedHeight, mobileHeight)
    }

    // Breakpoint-specific adjustments
    switch (currentBreakpoint) {
      case 'xs':
        return Math.min(calculatedHeight, 200)
      case 'sm':
        return Math.min(calculatedHeight, 250)
      case 'md':
        return Math.min(calculatedHeight, 300)
      case 'lg':
        return Math.min(calculatedHeight, 350)
      default:
        return calculatedHeight
    }
  }, [height, mobileHeight, aspectRatio, minHeight, maxHeight, isMobile, currentBreakpoint])

  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerDimensions({
          width: rect.width,
          height: calculateResponsiveHeight()
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    // Initial calculation
    updateDimensions()

    return () => {
      resizeObserver.disconnect()
    }
  }, [calculateResponsiveHeight])

  const getResponsiveHeight = () => {
    return containerDimensions.height || calculateResponsiveHeight()
  }

  // Get responsive font sizes based on screen size
  const getFontSizes = () => {
    if (isMobile) {
      return { tick: 10, title: 12, legend: 10 }
    }
    if (isTablet) {
      return { tick: 11, title: 14, legend: 11 }
    }
    return { tick: 12, title: 16, legend: 12 }
  }

  const fontSizes = getFontSizes()

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={getResponsiveHeight()}>
      <LineChart
        data={data as MonthlyData[]}
        margin={{
          top: 20,
          right: isMobile ? 10 : 30,
          left: isMobile ? 10 : 20,
          bottom: isMobile ? 40 : 20
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          horizontal={true}
          vertical={!isMobile}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{
            fill: '#9CA3AF',
            fontSize: fontSizes.tick,
            fontWeight: 500
          }}
          interval={currentBreakpoint === 'xs' ? 2 : isMobile ? 1 : 0}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 60 : 40}
          minTickGap={isMobile ? 5 : 10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{
            fill: '#9CA3AF',
            fontSize: fontSizes.tick,
            fontWeight: 500
          }}
          width={isMobile ? 40 : 60}
          tickFormatter={(value) => isMobile && value > 1000 ? `${(value/1000).toFixed(1)}k` : value.toString()}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#6B7280', strokeWidth: 1, strokeDasharray: '3 3' }}
          animationDuration={interactive ? 200 : 0}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: fontSizes.legend }}
            iconType="line"
            align={isMobile ? 'center' : 'right'}
            verticalAlign={isMobile ? 'bottom' : 'top'}
            layout={isMobile ? 'horizontal' : 'vertical'}
          />
        )}
        <Line
          type="monotone"
          dataKey="citizens"
          stroke={COLORS.blue}
          strokeWidth={isMobile ? 2 : 3}
          dot={{
            fill: COLORS.blue,
            strokeWidth: 2,
            r: isMobile ? 3 : 4,
            strokeOpacity: interactive ? 1 : 0.8
          }}
          name="Πολίτες"
          connectNulls={false}
          animationDuration={interactive ? 1500 : 0}
        />
        <Line
          type="monotone"
          dataKey="requests"
          stroke={COLORS.green}
          strokeWidth={isMobile ? 2 : 3}
          dot={{
            fill: COLORS.green,
            strokeWidth: 2,
            r: isMobile ? 3 : 4,
            strokeOpacity: interactive ? 1 : 0.8
          }}
          name="Αιτήματα"
          connectNulls={false}
          animationDuration={interactive ? 1500 : 0}
        />
        <Line
          type="monotone"
          dataKey="military"
          stroke={COLORS.yellow}
          strokeWidth={isMobile ? 2 : 3}
          dot={{
            fill: COLORS.yellow,
            strokeWidth: 2,
            r: isMobile ? 3 : 4,
            strokeOpacity: interactive ? 1 : 0.8
          }}
          name="Στρατιωτικό"
          connectNulls={false}
          animationDuration={interactive ? 1500 : 0}
        />
      </LineChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => {
    const radius = getResponsiveHeight() * 0.35
    const innerRadius = radius * 0.4

    return (
      <ResponsiveContainer width="100%" height={getResponsiveHeight()}>
        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Pie
            data={data as StatusData[]}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={radius}
            dataKey="value"
            label={!isMobile && !showLegend ? ({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%` : false}
            labelLine={false}
            animationDuration={interactive ? 1000 : 0}
            animationBegin={0}
          >
            {(data as StatusData[]).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke={entry.color}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip />}
            animationDuration={interactive ? 200 : 0}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: fontSizes.legend }}
              iconType="circle"
              align="center"
              verticalAlign="bottom"
              layout="horizontal"
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontWeight: 500 }}>
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={getResponsiveHeight()}>
      <BarChart
        data={data as MonthlyData[]}
        margin={{
          top: 20,
          right: isMobile ? 10 : 30,
          left: isMobile ? 10 : 20,
          bottom: isMobile ? 40 : 20
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{
            fill: '#9CA3AF',
            fontSize: fontSizes.tick,
            fontWeight: 500
          }}
          interval={currentBreakpoint === 'xs' ? 2 : isMobile ? 1 : 0}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 60 : 40}
          minTickGap={isMobile ? 5 : 10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{
            fill: '#9CA3AF',
            fontSize: fontSizes.tick,
            fontWeight: 500
          }}
          width={isMobile ? 40 : 60}
          tickFormatter={(value) => isMobile && value > 1000 ? `${(value/1000).toFixed(1)}k` : value.toString()}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
          animationDuration={interactive ? 200 : 0}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: fontSizes.legend }}
            iconType="rect"
            align={isMobile ? 'center' : 'right'}
            verticalAlign={isMobile ? 'bottom' : 'top'}
            layout={isMobile ? 'horizontal' : 'vertical'}
          />
        )}
        <Bar
          dataKey="citizens"
          fill={COLORS.blue}
          radius={[isMobile ? 2 : 4, isMobile ? 2 : 4, 0, 0]}
          name="Πολίτες"
          animationDuration={interactive ? 1000 : 0}
          maxBarSize={isMobile ? 40 : 60}
        />
        <Bar
          dataKey="requests"
          fill={COLORS.green}
          radius={[isMobile ? 2 : 4, isMobile ? 2 : 4, 0, 0]}
          name="Αιτήματα"
          animationDuration={interactive ? 1000 : 0}
          maxBarSize={isMobile ? 40 : 60}
        />
        <Bar
          dataKey="military"
          fill={COLORS.yellow}
          radius={[isMobile ? 2 : 4, isMobile ? 2 : 4, 0, 0]}
          name="Στρατιωτικό"
          animationDuration={interactive ? 1000 : 0}
          maxBarSize={isMobile ? 40 : 60}
        />
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div
      ref={containerRef}
      className={`bg-slate-800 border border-slate-700 rounded-xl responsive-padding ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-white truncate ${
          isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'
        }`}>
          {title}
        </h3>

        {/* Chart Type Indicator */}
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          {type === 'line' && (
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-blue-400 mr-1"></div>
              <span>Γραμμικό</span>
            </div>
          )}
          {type === 'pie' && (
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-blue-400 rounded-full mr-1"></div>
              <span>Κυκλικό</span>
            </div>
          )}
          {type === 'bar' && (
            <div className="flex items-center">
              <div className="w-1 h-3 bg-blue-400 mr-1"></div>
              <span>Στήλες</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        {containerDimensions.width > 0 && (
          <>
            {type === 'line' && renderLineChart()}
            {type === 'pie' && renderPieChart()}
            {type === 'bar' && renderBarChart()}
          </>
        )}

        {/* Loading placeholder while measuring */}
        {containerDimensions.width === 0 && (
          <div
            className="bg-slate-700/30 rounded-lg flex items-center justify-center"
            style={{ height: getResponsiveHeight() }}
          >
            <div className="text-gray-500 text-sm">
              Φόρτωση γραφήματος...
            </div>
          </div>
        )}
      </div>

      {/* Mobile Legend for Pie Charts */}
      {type === 'pie' && isMobile && !showLegend && (data as StatusData[]).length <= 4 && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {(data as StatusData[]).map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300 truncate">{entry.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}