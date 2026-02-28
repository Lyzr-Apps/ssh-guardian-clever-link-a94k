'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { VscHistory, VscSearch } from 'react-icons/vsc'
import DashboardSection from './sections/DashboardSection'
import DiagnosisSection from './sections/DiagnosisSection'
import RemediationSection from './sections/RemediationSection'
import HealthMonitorSection from './sections/HealthMonitorSection'

const DIAGNOSIS_AGENT_ID = '69a27b78e558069e826f040c'
const REMEDIATION_AGENT_ID = '69a27b7800b22915dd81e14f'
const HEALTH_MONITOR_AGENT_ID = '69a27b798e6d0e51fd5cd395'

const THEME_VARS = {
  '--background': '120 15% 3%',
  '--foreground': '120 100% 50%',
  '--card': '120 12% 5%',
  '--card-foreground': '120 100% 50%',
  '--primary': '120 100% 45%',
  '--primary-foreground': '120 15% 3%',
  '--secondary': '120 20% 10%',
  '--secondary-foreground': '120 90% 55%',
  '--accent': '120 100% 40%',
  '--accent-foreground': '120 15% 3%',
  '--destructive': '0 100% 50%',
  '--muted': '120 15% 12%',
  '--muted-foreground': '120 60% 35%',
  '--border': '120 50% 20%',
  '--input': '120 30% 15%',
  '--ring': '120 100% 45%',
  '--radius': '0rem',
} as React.CSSProperties

type Screen = 'dashboard' | 'diagnosis' | 'remediation' | 'health' | 'history'

interface SessionEntry {
  id: string
  ip: string
  timestamp: string
  issuesFound: number
  fixesApplied: number
  outcome: string
  duration: string
}

const SAMPLE_DIAGNOSIS = {
  success: true,
  response: {
    status: 'success' as const,
    result: {
      service_status: { service_name: 'motadata', status: 'Degraded', uptime: '3d 12h 45m', details: 'Service running with reduced capacity. 1 of 3 workers reporting errors.' },
      log_analysis: [
        { severity: 'ERROR', timestamp: '2024-01-15 14:32:01', message: 'OutOfMemoryError in datastore worker - heap space exhausted', source_file: '/motadata/motadata/logs/datastore.log', stack_trace: 'java.lang.OutOfMemoryError: Java heap space\n  at com.motadata.core.DataProcessor.process(DataProcessor.java:142)\n  at com.motadata.core.Worker.run(Worker.java:89)' },
        { severity: 'WARN', timestamp: '2024-01-15 14:30:55', message: 'Connection pool nearing max capacity (48/50 active)', source_file: '/motadata/motadata/logs/app.log', stack_trace: '' },
        { severity: 'ERROR', timestamp: '2024-01-15 14:28:12', message: 'Failed to write metrics to disk - permission denied on /motadata/data/metrics', source_file: '/motadata/motadata/logs/bootstrap.log', stack_trace: 'java.io.IOException: Permission denied\n  at java.io.FileOutputStream.open(FileOutputStream.java:270)' },
        { severity: 'INFO', timestamp: '2024-01-15 14:25:00', message: 'Scheduled backup completed successfully', source_file: '/motadata/motadata/logs/app.log', stack_trace: '' },
      ],
      config_issues: [
        { file_path: '/motadata/motadata/config/datastore.json', issue: 'Heap size too low for current data volume', current_value: '-Xmx512m', suggested_value: '-Xmx2048m', severity: 'high' },
        { file_path: '/motadata/motadata/config/app.json', issue: 'Connection pool max too low', current_value: '"max_connections": 50', suggested_value: '"max_connections": 200', severity: 'medium' },
      ],
      worker_health: [
        { worker_name: 'motadata app', status: 'Running', uptime: '3d 12h', details: 'Connection pool near capacity' },
        { worker_name: 'datastore', status: 'Down', uptime: '0m (crashed)', details: 'OOM killed 2 minutes ago' },
        { worker_name: 'bootstrap', status: 'Running', uptime: '3d 12h', details: 'Metrics write permission error' },
      ],
      recommended_fixes: [
        { fix_number: 1, description: 'Increase datastore heap size from 512m to 2048m', command: "sed -i 's/-Xmx512m/-Xmx2048m/g' /motadata/motadata/config/datastore.json", is_destructive: false, severity: 'high' },
        { fix_number: 2, description: 'Increase connection pool max from 50 to 200', command: "sed -i 's/\"max_connections\": 50/\"max_connections\": 200/g' /motadata/motadata/config/app.json", is_destructive: false, severity: 'medium' },
        { fix_number: 3, description: 'Fix permissions on metrics directory', command: 'chown -R motadata:motadata /motadata/data/metrics && chmod 755 /motadata/data/metrics', is_destructive: false, severity: 'high' },
        { fix_number: 4, description: 'Clear stale lock files and restart datastore', command: 'rm -f /motadata/data/datastore/*.lock && systemctl restart motadata-datastore', is_destructive: true, severity: 'high' },
      ],
      summary: '## Diagnosis Complete\n\nThe Motadata service is running in a **degraded state**. The datastore worker has crashed due to an OutOfMemoryError.\n\n### Root Causes:\n- Insufficient heap memory allocated to datastore (512MB vs recommended 2GB)\n- File permission mismatch on /motadata/data/metrics directory\n- Connection pool configuration too conservative for current load\n\n### Recommended: Apply fixes #1, #2, #3 immediately. Fix #4 requires confirmation (destructive).',
    },
    message: '',
  },
}

const SAMPLE_SESSIONS: SessionEntry[] = [
  { id: '1', ip: '192.168.1.100', timestamp: '2024-01-15 14:35:00', issuesFound: 4, fixesApplied: 3, outcome: 'resolved', duration: '12m 30s' },
  { id: '2', ip: '10.0.0.55', timestamp: '2024-01-14 09:12:00', issuesFound: 2, fixesApplied: 2, outcome: 'resolved', duration: '8m 15s' },
  { id: '3', ip: '172.16.0.22', timestamp: '2024-01-13 16:45:00', issuesFound: 5, fixesApplied: 3, outcome: 'partial', duration: '22m 10s' },
  { id: '4', ip: '192.168.1.100', timestamp: '2024-01-12 11:20:00', issuesFound: 1, fixesApplied: 0, outcome: 'failed', duration: '5m 45s' },
]

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(120,15%,3%)] text-[hsl(120,100%,50%)] font-mono">
          <div className="text-center p-8 max-w-md border border-[hsl(120,50%,20%)]">
            <h2 className="text-xl font-semibold mb-2 tracking-wider">SYSTEM ERROR</h2>
            <p className="text-[hsl(120,60%,35%)] mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] text-sm tracking-wider font-bold">
              RETRY
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function SessionHistoryView({ sessions, onNavigate }: { sessions: SessionEntry[]; onNavigate: (s: string) => void }) {
  const [search, setSearch] = useState('')
  const filtered = Array.isArray(sessions)
    ? sessions.filter(s => (s?.ip ?? '').includes(search) || (s?.timestamp ?? '').includes(search))
    : []

  return (
    <div className="min-h-screen bg-[hsl(120,15%,3%)] font-mono relative">
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />
      <div className="relative z-20">
        <div className="border-b border-[hsl(120,50%,20%)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] text-xs tracking-wider">&lt; BACK</button>
            <Separator orientation="vertical" className="h-4 bg-[hsl(120,50%,20%)]" />
            <h1 className="text-sm font-bold text-[hsl(120,100%,50%)] tracking-wider uppercase flex items-center gap-2">
              <VscHistory className="w-4 h-4" /> Session History
            </h1>
          </div>
        </div>
        <div className="p-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <VscSearch className="w-4 h-4 text-[hsl(120,60%,35%)]" />
            <Input placeholder="Search by IP or date..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[hsl(120,15%,3%)] border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] font-mono rounded-none text-xs placeholder:text-[hsl(120,60%,25%)]" />
          </div>
          <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[hsl(120,50%,20%)] hover:bg-transparent">
                    <TableHead className="text-[hsl(120,60%,35%)] text-[10px] tracking-wider uppercase font-bold">Date</TableHead>
                    <TableHead className="text-[hsl(120,60%,35%)] text-[10px] tracking-wider uppercase font-bold">Machine IP</TableHead>
                    <TableHead className="text-[hsl(120,60%,35%)] text-[10px] tracking-wider uppercase font-bold">Issues</TableHead>
                    <TableHead className="text-[hsl(120,60%,35%)] text-[10px] tracking-wider uppercase font-bold">Fixes</TableHead>
                    <TableHead className="text-[hsl(120,60%,35%)] text-[10px] tracking-wider uppercase font-bold">Outcome</TableHead>
                    <TableHead className="text-[hsl(120,60%,35%)] text-[10px] tracking-wider uppercase font-bold">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((session) => (
                    <TableRow key={session.id} className="border-b border-[hsl(120,50%,15%)] hover:bg-[hsl(120,20%,8%)]">
                      <TableCell className="text-[10px] text-[hsl(120,90%,55%)] tracking-wider">{session.timestamp}</TableCell>
                      <TableCell className="text-[10px] text-[hsl(120,100%,50%)] tracking-wider font-bold">{session.ip}</TableCell>
                      <TableCell className="text-[10px] text-[hsl(120,90%,55%)] tracking-wider">{session.issuesFound}</TableCell>
                      <TableCell className="text-[10px] text-[hsl(120,90%,55%)] tracking-wider">{session.fixesApplied}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-none text-[9px] tracking-wider ${session.outcome === 'resolved' ? 'bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)]' : session.outcome === 'partial' ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'}`}>
                          {(session.outcome ?? '').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-[hsl(120,90%,55%)] tracking-wider">{session.duration}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[10px] text-[hsl(120,60%,35%)] tracking-wider py-8">
                        {(sessions?.length ?? 0) === 0 ? 'No sessions recorded yet' : 'No matching sessions found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [connectionDetails, setConnectionDetails] = useState({ ip: '', username: '', password: '' })
  const [vpnConnected, setVpnConnected] = useState(true)
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null)
  const [selectedFixes, setSelectedFixes] = useState<number[]>([])
  const [editedCommands, setEditedCommands] = useState<Record<number, string>>({})
  const [remediationResult, setRemediationResult] = useState<any>(null)
  const [healthData, setHealthData] = useState<any>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [healthLogs, setHealthLogs] = useState<string[]>([])
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showSample, setShowSample] = useState(false)
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('motadata-sessions')
      if (saved) setSessions(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('motadata-sessions', JSON.stringify(sessions))
    } catch { /* ignore */ }
  }, [sessions])

  useEffect(() => {
    if (showSample) {
      setDiagnosisResult(SAMPLE_DIAGNOSIS)
      setSessions(SAMPLE_SESSIONS)
      setConnectionDetails({ ip: '192.168.1.100', username: 'root', password: 'motadata2024' })
    } else {
      setDiagnosisResult(null)
      setRemediationResult(null)
      setHealthData(null)
      setSelectedFixes([])
      setEditedCommands({})
      setHealthLogs([])
      setConnectionDetails({ ip: '', username: '', password: '' })
      try {
        const saved = localStorage.getItem('motadata-sessions')
        if (saved) setSessions(JSON.parse(saved))
        else setSessions([])
      } catch { setSessions([]) }
    }
  }, [showSample])

  useEffect(() => {
    return () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current)
    }
  }, [])

  const addLog = useCallback((msg: string) => {
    setHealthLogs(prev => [...prev, msg])
  }, [])

  const handleRunDiagnosis = async () => {
    setLoading(true)
    setErrorMsg(null)
    setActiveAgentId(DIAGNOSIS_AGENT_ID)
    try {
      const message = `Diagnose Motadata service on machine ${connectionDetails.ip}. SSH credentials: username=${connectionDetails.username}. Check service status, analyze logs at /motadata/motadata/logs, inspect configs at /motadata/motadata/config, check worker health for motadata app, datastore, and bootstrap.`
      const result = await callAIAgent(message, DIAGNOSIS_AGENT_ID)
      if (result.success) {
        setDiagnosisResult(result)
        setCurrentScreen('diagnosis')
      } else {
        setErrorMsg(result?.error ?? 'Diagnosis failed')
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Diagnosis failed')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleApplyFixes = async () => {
    setLoading(true)
    setErrorMsg(null)
    setActiveAgentId(REMEDIATION_AGENT_ID)
    const startTime = Date.now()
    try {
      const data = diagnosisResult?.response?.result
      const fixes = Array.isArray(data?.recommended_fixes) ? data.recommended_fixes : []
      const selectedFixDetails = fixes.filter((f: any) => selectedFixes.includes(f?.fix_number))
      const fixDescriptions = selectedFixDetails.map((f: any) => {
        const cmd = editedCommands[f.fix_number] ?? f.command
        return `Fix #${f.fix_number}: ${f.description} - Command: ${cmd}`
      }).join('\n')
      const message = `Apply the following approved fixes on machine ${connectionDetails.ip}:\n${fixDescriptions}\nAfter applying fixes, restart the Motadata service. Create backups before modifying configs.`
      const result = await callAIAgent(message, REMEDIATION_AGENT_ID)
      if (result.success) {
        setRemediationResult(result)
        setCurrentScreen('remediation')
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        const newSession: SessionEntry = {
          id: String(Date.now()),
          ip: connectionDetails.ip,
          timestamp: new Date().toLocaleString(),
          issuesFound: fixes.length,
          fixesApplied: selectedFixes.length,
          outcome: 'resolved',
          duration: `${elapsed}s`,
        }
        setSessions(prev => [...prev, newSession])
      } else {
        setErrorMsg(result?.error ?? 'Remediation failed')
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Remediation failed')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const runHealthCheck = useCallback(async () => {
    setActiveAgentId(HEALTH_MONITOR_AGENT_ID)
    addLog('Polling worker health status...')
    try {
      const message = `Monitor health of Motadata service on machine ${connectionDetails.ip}. Check status of workers: motadata app, datastore, bootstrap. Report running status, uptime, PID, memory usage, and any anomalies.`
      const result = await callAIAgent(message, HEALTH_MONITOR_AGENT_ID)
      if (result.success) {
        setHealthData(result)
        const workers = Array.isArray(result?.response?.result?.workers) ? result.response.result.workers : []
        workers.forEach((w: any) => {
          addLog(`Worker "${w?.worker_name ?? 'unknown'}": ${(w?.status ?? 'unknown').toUpperCase()} | PID: ${w?.pid ?? 'N/A'} | Mem: ${w?.memory_usage ?? 'N/A'}`)
        })
        const alerts = Array.isArray(result?.response?.result?.alerts) ? result.response.result.alerts : []
        alerts.forEach((a: any) => {
          addLog(`ALERT [${a?.worker_name ?? ''}]: ${a?.message ?? ''}`)
        })
        addLog(`Overall: ${result?.response?.result?.overall_health ?? 'unknown'}`)
      } else {
        addLog(`ERROR: ${result?.error ?? 'Health check failed'}`)
      }
    } catch (err: any) {
      addLog(`ERROR: ${err?.message ?? 'Health check failed'}`)
    } finally {
      setActiveAgentId(null)
    }
  }, [connectionDetails.ip, addLog])

  const handleWatchHealth = useCallback(() => {
    setCurrentScreen('health')
    setIsMonitoring(true)
    setHealthLogs([])
    addLog('Health monitoring started...')
    runHealthCheck()
    monitorIntervalRef.current = setInterval(() => {
      runHealthCheck()
    }, 15000)
  }, [runHealthCheck, addLog])

  const handleStopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current)
      monitorIntervalRef.current = null
    }
    addLog('Health monitoring stopped.')
  }, [addLog])

  const navigate = useCallback((screen: string) => {
    setCurrentScreen(screen as Screen)
    setErrorMsg(null)
  }, [])

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-[hsl(120,15%,3%)] text-[hsl(120,100%,50%)] font-mono">
        {errorMsg && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 border-b border-red-500/30 p-3 flex items-center justify-between">
            <span className="text-xs text-red-400 tracking-wider">ERROR: {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-300 text-xs tracking-wider">DISMISS</button>
          </div>
        )}

        {currentScreen === 'dashboard' && (
          <DashboardSection
            connectionDetails={connectionDetails}
            setConnectionDetails={setConnectionDetails}
            vpnConnected={vpnConnected}
            setVpnConnected={setVpnConnected}
            loading={loading}
            onRunDiagnosis={handleRunDiagnosis}
            onNavigate={navigate}
            sessions={sessions}
            showSample={showSample}
            setShowSample={setShowSample}
          />
        )}

        {currentScreen === 'diagnosis' && (
          <DiagnosisSection
            diagnosisResult={diagnosisResult}
            selectedFixes={selectedFixes}
            setSelectedFixes={setSelectedFixes}
            editedCommands={editedCommands}
            setEditedCommands={setEditedCommands}
            loading={loading}
            onApplyFixes={handleApplyFixes}
            onRerunDiagnosis={handleRunDiagnosis}
            onNavigate={navigate}
            activeAgentId={activeAgentId}
          />
        )}

        {currentScreen === 'remediation' && (
          <RemediationSection
            remediationResult={remediationResult}
            loading={loading}
            onWatchHealth={handleWatchHealth}
            onNavigate={navigate}
            activeAgentId={activeAgentId}
          />
        )}

        {currentScreen === 'health' && (
          <HealthMonitorSection
            healthData={healthData}
            isMonitoring={isMonitoring}
            healthLogs={healthLogs}
            loading={loading}
            onStopMonitoring={handleStopMonitoring}
            onNavigate={navigate}
            activeAgentId={activeAgentId}
          />
        )}

        {currentScreen === 'history' && (
          <SessionHistoryView
            sessions={showSample ? SAMPLE_SESSIONS : sessions}
            onNavigate={navigate}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
