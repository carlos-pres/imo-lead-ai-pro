import { StatsCard } from '../StatsCard'
import { Users } from 'lucide-react'

export default function StatsCardExample() {
  return (
    <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        title="Total de Leads"
        value="1,234"
        icon={Users}
        trend={{ value: "12%", isPositive: true }}
      />
      <StatsCard
        title="Leads Quentes"
        value="156"
        description="Alto potencial de conversão"
        icon={Users}
      />
    </div>
  )
}
