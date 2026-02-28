'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { VscTerminal, VscWarning, VscPulse, VscDebugStop } from 'react-icons/vsc'
import { Loader2 } from 'lucide-react'

interface HealthMonitorSectionProps {
  healthData: any
  isMonitoring: boolean
  healthLogs: string[]
  loading: boolean
  onStopMonitoring: () => void
  onNavigate: (screen: string) => void
  activeAgentId: string | null
}

function statusPulse(status: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'running' || s === 'active' || s === 'healthy') return 'bg-[hsl(120,100%,50%)] animate-pulse'
  if (s === 'down' || s === 'stopped' || s === 'failed' || s === 'unhealthy') return 'bg-red-500'
  return 'bg-amber-500 animate-pulse'
}

function statusText(status: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'running' || s === 'active' || s === 'healthy') return 'text-[hsl(120,100%,50%)]'
  if (s === 'down' || s === 'stopped' || s === 'failed' || s === 'unhealthy') return 'text-red-500'
  return 'text-amber-500'
}

export default function HealthMonitorSection({
  healthData,
  isMonitoring,
  healthLogs,
  loading,
  onStopMonitoring,
  onNavigate,
  activeAgentId,
}: HealthMonitorSectionProps) {
  const logEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [healthLogs])

  const data = healthData?.response?.result
  const workers = Array.isArray(data?.workers) ? data.workers : []
  const alerts = Array.isArray(data?.alerts) ? data.alerts : []
  const overallHealth = data?.overall_health ?? ''
  const timestamp = data?.timestamp ?? ''
  const summary = data?.summary ?? ''

  return (
    <div className="min-h-screen bg-[hsl(120,15%,3%)] font-mono relative">
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />
      <div className="relative z-20">
        {/* Header */}
        <div className="border-b border-[hsl(120,50%,20%)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] text-xs tracking-wider">&lt; BACK</button>
            <Separator orientation="vertical" className="h-4 bg-[hsl(120,50%,20%)]" />
            <h1 className="text-sm font-bold text-[hsl(120,100%,50%)] tracking-wider uppercase flex items-center gap-2">
              <VscPulse className="w-4 h-4" /> Health Monitor
            </h1>
            {isMonitoring && (
              <Badge className="bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] rounded-none text-[9px] tracking-wider animate-pulse">LIVE</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeAgentId && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(120,100%,50%)] animate-pulse" />
                <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">POLLING</span>
              </div>
            )}
            {timestamp && (
              <span className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider">Last: {timestamp}</span>
            )}
          </div>
        </div>

        {/* Alert Banner */}
        {alerts.length > 0 && (
          <div className="mx-4 mt-4 space-y-2">
            {alerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30">
                <VscWarning className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 font-bold tracking-wider">{alert?.worker_name ?? ''}</span>
                    <Badge className="bg-red-500/20 text-red-400 rounded-none text-[9px] tracking-wider border-red-500/30">{(alert?.alert_type ?? '').toUpperCase()}</Badge>
                  </div>
                  <p className="text-[10px] text-red-400 mt-1">{alert?.message ?? ''}</p>
                  {alert?.suggested_action && (
                    <p className="text-[10px] text-red-400/70 mt-1 tracking-wider">Suggested: {alert.suggested_action}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overall Health */}
        {overallHealth && (
          <div className="mx-4 mt-4 p-3 border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)] flex items-center justify-between">
            <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider uppercase">Overall Health:</span>
            <span className={`text-xs font-bold tracking-wider uppercase ${statusText(overallHealth)}`}>{overallHealth}</span>
          </div>
        )}

        {/* Worker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {workers.map((w: any, i: number) => (
            <Card key={i} className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase">{w?.worker_name ?? `Worker ${i + 1}`}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusPulse(w?.status ?? '')}`} />
                    <span className={`text-[10px] tracking-wider font-bold ${statusText(w?.status ?? '')}`}>{(w?.status ?? 'UNKNOWN').toUpperCase()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-[hsl(120,50%,20%)] bg-[hsl(120,15%,3%)] p-2">
                    <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider uppercase">Uptime</p>
                    <p className="text-xs text-[hsl(120,100%,50%)] tracking-wider">{w?.uptime ?? 'N/A'}</p>
                  </div>
                  <div className="border border-[hsl(120,50%,20%)] bg-[hsl(120,15%,3%)] p-2">
                    <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider uppercase">PID</p>
                    <p className="text-xs text-[hsl(120,100%,50%)] tracking-wider">{w?.pid ?? 'N/A'}</p>
                  </div>
                </div>
                <div className="border border-[hsl(120,50%,20%)] bg-[hsl(120,15%,3%)] p-2">
                  <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider uppercase">Memory</p>
                  <p className="text-xs text-[hsl(120,100%,50%)] tracking-wider">{w?.memory_usage ?? 'N/A'}</p>
                </div>
                {w?.anomalies && w.anomalies !== 'none' && w.anomalies !== '' && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30">
                    <p className="text-[9px] text-amber-500 tracking-wider uppercase">Anomalies</p>
                    <p className="text-[10px] text-amber-400">{w.anomalies}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {workers.length === 0 && !loading && (
            <div className="col-span-3 text-center py-10">
              <p className="text-xs text-[hsl(120,60%,35%)] tracking-wider">
                {isMonitoring ? 'Waiting for health data...' : 'No health data available'}
              </p>
            </div>
          )}

          {loading && workers.length === 0 && (
            <div className="col-span-3 flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[hsl(120,100%,50%)] mr-3" />
              <span className="text-xs text-[hsl(120,100%,50%)] tracking-wider">Checking health...</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="mx-4 p-3 border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)]">
            <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider uppercase mb-1">Summary</p>
            <p className="text-xs text-[hsl(120,90%,55%)]">{summary}</p>
          </div>
        )}

        {/* Live Log Stream */}
        <div className="p-4">
          <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                <VscTerminal className="w-3 h-3" /> Health Log Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ScrollArea className="h-48">
                <div className="bg-[hsl(120,15%,3%)] border border-[hsl(120,50%,20%)] p-2 space-y-0.5 min-h-[180px]">
                  {Array.isArray(healthLogs) && healthLogs.map((log, i) => (
                    <p key={i} className="text-[10px] text-[hsl(120,90%,55%)] tracking-wider">
                      <span className="text-[hsl(120,60%,35%)]">[{String(i + 1).padStart(3, '0')}]</span> {log}
                    </p>
                  ))}
                  {(!Array.isArray(healthLogs) || healthLogs.length === 0) && (
                    <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">Waiting for log entries...</p>
                  )}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="px-4 pb-6 flex gap-3">
          <Button
            onClick={onStopMonitoring}
            disabled={!isMonitoring}
            className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-none tracking-wider text-xs uppercase"
          >
            <VscDebugStop className="mr-2 w-3 h-3" /> Stop Monitoring
          </Button>
          <Button
            onClick={() => onNavigate('dashboard')}
            variant="outline"
            className="border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] hover:bg-[hsl(120,20%,10%)] rounded-none tracking-wider text-xs uppercase bg-transparent"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
