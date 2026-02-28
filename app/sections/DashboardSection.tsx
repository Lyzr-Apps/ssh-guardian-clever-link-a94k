'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { VscTerminal, VscHistory, VscShield, VscKey, VscRemote } from 'react-icons/vsc'
import { Loader2, Eye, EyeOff } from 'lucide-react'

interface SessionEntry {
  id: string
  ip: string
  timestamp: string
  issuesFound: number
  fixesApplied: number
  outcome: string
  duration: string
}

interface DashboardSectionProps {
  connectionDetails: { ip: string; username: string; password: string }
  setConnectionDetails: React.Dispatch<React.SetStateAction<{ ip: string; username: string; password: string }>>
  vpnConnected: boolean
  setVpnConnected: React.Dispatch<React.SetStateAction<boolean>>
  loading: boolean
  onRunDiagnosis: () => void
  onNavigate: (screen: string) => void
  sessions: SessionEntry[]
  showSample: boolean
  setShowSample: React.Dispatch<React.SetStateAction<boolean>>
}

export default function DashboardSection({
  connectionDetails,
  setConnectionDetails,
  vpnConnected,
  setVpnConnected,
  loading,
  onRunDiagnosis,
  onNavigate,
  sessions,
  showSample,
  setShowSample,
}: DashboardSectionProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  const isFormValid = connectionDetails.ip.trim() !== '' && connectionDetails.username.trim() !== '' && connectionDetails.password.trim() !== ''

  const lastSession = Array.isArray(sessions) && sessions.length > 0 ? sessions[sessions.length - 1] : null

  return (
    <div className="flex min-h-screen font-mono">
      {/* Left Sidebar */}
      <div className="w-56 border-r border-[hsl(120,50%,20%)] bg-[hsl(120,12%,4%)] flex flex-col">
        <div className="p-4 border-b border-[hsl(120,50%,20%)]">
          <div className="flex items-center gap-2 text-[hsl(120,100%,50%)]">
            <VscTerminal className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wider uppercase">Motadata</span>
          </div>
          <p className="text-[hsl(120,60%,35%)] text-xs mt-1 tracking-wider">Service Troubleshooter</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(120,100%,50%)] bg-[hsl(120,20%,10%)] border border-[hsl(120,50%,20%)] tracking-wider">
            <VscTerminal className="w-4 h-4" />
            Dashboard
          </button>
          <button onClick={() => onNavigate('history')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] hover:bg-[hsl(120,20%,10%)] tracking-wider transition-colors">
            <VscHistory className="w-4 h-4" />
            Session History
          </button>
        </nav>

        <div className="p-4 border-t border-[hsl(120,50%,20%)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[hsl(120,60%,35%)] tracking-wider">VPN Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${vpnConnected ? 'bg-[hsl(120,100%,50%)] animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs tracking-wider ${vpnConnected ? 'text-[hsl(120,100%,50%)]' : 'text-red-500'}`}>
                {vpnConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <Switch checked={vpnConnected} onCheckedChange={setVpnConnected} className="data-[state=checked]:bg-[hsl(120,100%,45%)]" />
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 bg-[hsl(120,15%,3%)] relative overflow-y-auto">
        {/* Scanline overlay */}
        <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />

        <div className="relative z-20 p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-[hsl(120,100%,50%)] tracking-wider uppercase">System Diagnostics</h1>
              <p className="text-[hsl(120,60%,35%)] text-xs mt-1 tracking-wider">SSH into target machine and run: service motadata status</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[hsl(120,60%,35%)] tracking-wider">Sample Data</span>
              <Switch checked={showSample} onCheckedChange={setShowSample} className="data-[state=checked]:bg-[hsl(120,100%,45%)]" />
            </div>
          </div>

          {/* Connection Form */}
          <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-[hsl(120,100%,50%)] text-sm tracking-wider uppercase flex items-center gap-2">
                <VscRemote className="w-4 h-4" />
                SSH Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[hsl(120,60%,35%)] text-xs tracking-wider uppercase">IP Address / Hostname</Label>
                <Input
                  placeholder="192.168.1.100"
                  value={connectionDetails.ip}
                  onChange={(e) => setConnectionDetails(prev => ({ ...prev, ip: e.target.value }))}
                  className="bg-[hsl(120,15%,3%)] border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] font-mono rounded-none placeholder:text-[hsl(120,60%,25%)] focus:ring-[hsl(120,100%,45%)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[hsl(120,60%,35%)] text-xs tracking-wider uppercase">SSH Username</Label>
                <div className="relative">
                  <VscKey className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[hsl(120,60%,35%)]" />
                  <Input
                    placeholder="root"
                    value={connectionDetails.username}
                    onChange={(e) => setConnectionDetails(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-[hsl(120,15%,3%)] border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] font-mono rounded-none pl-9 placeholder:text-[hsl(120,60%,25%)] focus:ring-[hsl(120,100%,45%)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[hsl(120,60%,35%)] text-xs tracking-wider uppercase">SSH Key / Password</Label>
                <div className="relative">
                  <VscShield className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[hsl(120,60%,35%)]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter credentials"
                    value={connectionDetails.password}
                    onChange={(e) => setConnectionDetails(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-[hsl(120,15%,3%)] border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] font-mono rounded-none pl-9 pr-10 placeholder:text-[hsl(120,60%,25%)] focus:ring-[hsl(120,100%,45%)]"
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Separator className="bg-[hsl(120,50%,20%)]" />

              <Button
                onClick={onRunDiagnosis}
                disabled={!isFormValid || loading || !vpnConnected}
                className="w-full bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] hover:bg-[hsl(120,100%,50%)] rounded-none font-bold tracking-wider uppercase disabled:opacity-40"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting & Diagnosing...</>
                ) : (
                  <><VscTerminal className="mr-2 w-4 h-4" /> Run Diagnosis</>
                )}
              </Button>

              {!vpnConnected && (
                <p className="text-red-500 text-xs tracking-wider text-center">VPN must be connected to run diagnosis</p>
              )}
            </CardContent>
          </Card>

          {/* Last Session */}
          {lastSession && (
            <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase">Last Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="text-[hsl(120,60%,35%)] tracking-wider">Machine: <span className="text-[hsl(120,100%,50%)]">{lastSession.ip}</span></p>
                    <p className="text-[hsl(120,60%,35%)] tracking-wider">Time: <span className="text-[hsl(120,100%,50%)]">{lastSession.timestamp}</span></p>
                  </div>
                  <Badge className={`rounded-none text-xs tracking-wider ${lastSession.outcome === 'resolved' ? 'bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)]' : lastSession.outcome === 'partial' ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'}`}>
                    {lastSession.outcome?.toUpperCase() ?? 'UNKNOWN'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Info */}
          <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase">Active Agents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'Diagnosis Agent', desc: 'Service status, log analysis, config inspection' },
                { name: 'Remediation Agent', desc: 'Applies approved fixes, restarts service' },
                { name: 'Health Monitor Agent', desc: 'Continuous worker health monitoring' },
              ].map((agent) => (
                <div key={agent.name} className="flex items-center justify-between text-xs py-1">
                  <div>
                    <span className="text-[hsl(120,100%,50%)] tracking-wider">{agent.name}</span>
                    <p className="text-[hsl(120,60%,35%)] tracking-wider text-[10px]">{agent.desc}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(120,100%,50%)]" />
                    <span className="text-[hsl(120,60%,35%)] tracking-wider">READY</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
