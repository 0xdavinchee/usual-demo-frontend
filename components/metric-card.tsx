import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <div className={`text-xs mt-1 ${trend.isPositive ? "text-green-400" : "text-red-400"}`}>
            {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}
