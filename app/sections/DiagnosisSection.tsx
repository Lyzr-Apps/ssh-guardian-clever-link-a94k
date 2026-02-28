'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { VscTerminal, VscWarning, VscChevronDown, VscChevronRight, VscServer, VscFile, VscSettingsGear, VscChecklist } from 'react-icons/vsc'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'

interface DiagnosisSectionProps {
  diagnosisResult: any
  selectedFixes: number[]
  setSelectedFixes: React.Dispatch<React.SetStateAction<number[]>>
  editedCommands: Record<number, string>
  setEditedCommands: React.Dispatch<React.SetStateAction<Record<number, string>>>
  loading: boolean
  onApplyFixes: () => void
  onRerunDiagnosis: () => void
  onNavigate: (screen: string) => void
  activeAgentId: string | null
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-xs mt-2 mb-1 text-[hsl(120,100%,50%)]">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-sm mt-2 mb-1 text-[hsl(120,100%,50%)]">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-base mt-3 mb-1 text-[hsl(120,100%,50%)]">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-xs text-[hsl(120,90%,55%)]">{line.slice(2)}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-xs text-[hsl(120,90%,55%)]">{line}</p>
      })}
    </div>
  )
}

function severityColor(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'error' || s === 'critical' || s === 'high') return 'text-red-500 border-red-500/50 bg-red-500/10'
  if (s === 'warn' || s === 'warning' || s === 'medium') return 'text-amber-500 border-amber-500/50 bg-amber-500/10'
  return 'text-[hsl(120,100%,50%)] border-[hsl(120,50%,20%)] bg-[hsl(120,100%,50%)]/10'
}

function statusBadge(status: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'running' || s === 'active' || s === 'up') return <Badge className="bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] rounded-none text-[10px] tracking-wider">{(status ?? '').toUpperCase()}</Badge>
  if (s === 'down' || s === 'stopped' || s === 'failed') return <Badge className="bg-red-500 text-white rounded-none text-[10px] tracking-wider">{(status ?? '').toUpperCase()}</Badge>
  return <Badge className="bg-amber-500 text-black rounded-none text-[10px] tracking-wider">{(status ?? '').toUpperCase()}</Badge>
}

export default function DiagnosisSection({
  diagnosisResult,
  selectedFixes,
  setSelectedFixes,
  editedCommands,
  setEditedCommands,
  loading,
  onApplyFixes,
  onRerunDiagnosis,
  onNavigate,
  activeAgentId,
}: DiagnosisSectionProps) {
  const [expandedLogs, setExpandedLogs] = React.useState<Set<number>>(new Set())

  const data = diagnosisResult?.response?.result
  const serviceStatus = data?.service_status
  const logs = Array.isArray(data?.log_analysis) ? data.log_analysis : []
  const configIssues = Array.isArray(data?.config_issues) ? data.config_issues : []
  const workers = Array.isArray(data?.worker_health) ? data.worker_health : []
  const fixes = Array.isArray(data?.recommended_fixes) ? data.recommended_fixes : []
  const summary = data?.summary ?? ''

  const toggleFix = (fixNum: number) => {
    setSelectedFixes(prev => prev.includes(fixNum) ? prev.filter(f => f !== fixNum) : [...prev, fixNum])
  }

  const toggleLog = (idx: number) => {
    setExpandedLogs(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[hsl(120,15%,3%)] font-mono relative">
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />
      <div className="relative z-20">
        {/* Header */}
        <div className="border-b border-[hsl(120,50%,20%)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] text-xs tracking-wider">&lt; BACK</button>
            <Separator orientation="vertical" className="h-4 bg-[hsl(120,50%,20%)]" />
            <h1 className="text-sm font-bold text-[hsl(120,100%,50%)] tracking-wider uppercase">Diagnosis Results</h1>
          </div>
          {activeAgentId && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(120,100%,50%)] animate-pulse" />
              <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">AGENT ACTIVE</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="mx-4 mt-4 p-3 border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)]">
            <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider uppercase mb-1">Summary</p>
            {renderMarkdown(summary)}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 p-4">
          {/* LEFT Column */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Service Status */}
            <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                  <VscServer className="w-3 h-3" /> Service Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="bg-[hsl(120,15%,3%)] border border-[hsl(120,50%,20%)] p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(120,60%,35%)] tracking-wider">{serviceStatus?.service_name ?? 'motadata'}</span>
                    {statusBadge(serviceStatus?.status ?? 'unknown')}
                  </div>
                  <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">Uptime: {serviceStatus?.uptime ?? 'N/A'}</p>
                  <p className="text-[10px] text-[hsl(120,90%,55%)] tracking-wider">{serviceStatus?.details ?? ''}</p>
                </div>
              </CardContent>
            </Card>

            {/* Log Analysis */}
            <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                  <VscFile className="w-3 h-3" /> Log Analysis ({logs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {logs.map((log: any, i: number) => (
                      <Collapsible key={i} open={expandedLogs.has(i)} onOpenChange={() => toggleLog(i)}>
                        <CollapsibleTrigger className="w-full">
                          <div className={`flex items-center gap-2 p-2 border text-left ${severityColor(log?.severity)}`}>
                            {expandedLogs.has(i) ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                            <Badge className={`rounded-none text-[9px] tracking-wider ${severityColor(log?.severity)}`}>{(log?.severity ?? 'INFO').toUpperCase()}</Badge>
                            <span className="text-[10px] truncate flex-1">{log?.message ?? ''}</span>
                            <span className="text-[9px] text-[hsl(120,60%,35%)] flex-shrink-0">{log?.timestamp ?? ''}</span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border border-t-0 border-[hsl(120,50%,20%)] bg-[hsl(120,15%,3%)] p-2 space-y-1">
                            <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">Source: {log?.source_file ?? 'N/A'}</p>
                            {log?.stack_trace && (
                              <pre className="text-[10px] text-red-400 whitespace-pre-wrap break-all bg-red-500/5 p-2 border border-red-500/20">{log.stack_trace}</pre>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                    {logs.length === 0 && <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider text-center py-4">No log entries found</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Config Issues */}
            <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                  <VscSettingsGear className="w-3 h-3" /> Config Issues ({configIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                {configIssues.map((issue: any, i: number) => (
                  <div key={i} className="border border-[hsl(120,50%,20%)] bg-[hsl(120,15%,3%)] p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[hsl(120,100%,50%)] tracking-wider">{issue?.file_path ?? ''}</span>
                      <Badge className={`rounded-none text-[9px] tracking-wider ${severityColor(issue?.severity)}`}>{(issue?.severity ?? '').toUpperCase()}</Badge>
                    </div>
                    <p className="text-[10px] text-[hsl(120,90%,55%)]">{issue?.issue ?? ''}</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="p-1 border border-red-500/30 bg-red-500/5">
                        <p className="text-[9px] text-red-400 tracking-wider">CURRENT</p>
                        <code className="text-[10px] text-red-400">{issue?.current_value ?? ''}</code>
                      </div>
                      <div className="p-1 border border-[hsl(120,50%,30%)] bg-[hsl(120,100%,50%)]/5">
                        <p className="text-[9px] text-[hsl(120,100%,50%)] tracking-wider">SUGGESTED</p>
                        <code className="text-[10px] text-[hsl(120,100%,50%)]">{issue?.suggested_value ?? ''}</code>
                      </div>
                    </div>
                  </div>
                ))}
                {configIssues.length === 0 && <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider text-center py-4">No config issues detected</p>}
              </CardContent>
            </Card>

            {/* Worker Health */}
            <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                  <VscTerminal className="w-3 h-3" /> Worker Health
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {workers.map((w: any, i: number) => (
                    <div key={i} className="border border-[hsl(120,50%,20%)] bg-[hsl(120,15%,3%)] p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[hsl(120,100%,50%)] tracking-wider font-bold">{w?.worker_name ?? ''}</span>
                        {statusBadge(w?.status ?? '')}
                      </div>
                      <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider">Uptime: {w?.uptime ?? 'N/A'}</p>
                      <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider">{w?.details ?? ''}</p>
                    </div>
                  ))}
                  {workers.length === 0 && <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider col-span-3 text-center py-4">No worker data</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT Column */}
          <div className="w-full lg:w-96 space-y-4">
            <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                  <VscChecklist className="w-3 h-3" /> Recommended Fixes ({fixes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {fixes.map((fix: any, i: number) => {
                      const fixNum = fix?.fix_number ?? i
                      const isSelected = selectedFixes.includes(fixNum)
                      const editedCmd = editedCommands[fixNum]
                      return (
                        <div key={i} className={`border p-2 space-y-2 ${isSelected ? 'border-[hsl(120,100%,45%)] bg-[hsl(120,100%,50%)]/5' : 'border-[hsl(120,50%,20%)] bg-[hsl(120,15%,3%)]'}`}>
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleFix(fixNum)}
                              className="mt-0.5 rounded-none border-[hsl(120,50%,20%)] data-[state=checked]:bg-[hsl(120,100%,45%)] data-[state=checked]:text-[hsl(120,15%,3%)]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-[hsl(120,100%,50%)] tracking-wider font-bold">FIX #{fixNum}</span>
                                <Badge className={`rounded-none text-[9px] tracking-wider ${severityColor(fix?.severity)}`}>{(fix?.severity ?? '').toUpperCase()}</Badge>
                                {fix?.is_destructive && (
                                  <span className="flex items-center gap-1 text-[9px] text-red-500 tracking-wider">
                                    <VscWarning className="w-3 h-3" /> DESTRUCTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[hsl(120,90%,55%)] mt-1">{fix?.description ?? ''}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider uppercase">Command:</p>
                            {isSelected ? (
                              <Textarea
                                value={editedCmd ?? fix?.command ?? ''}
                                onChange={(e) => setEditedCommands(prev => ({ ...prev, [fixNum]: e.target.value }))}
                                rows={2}
                                className="bg-[hsl(120,15%,3%)] border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] font-mono text-[10px] rounded-none resize-none focus:ring-[hsl(120,100%,45%)]"
                              />
                            ) : (
                              <code className="block text-[10px] text-[hsl(120,100%,50%)] bg-[hsl(120,15%,3%)] p-2 border border-[hsl(120,50%,20%)] break-all">{fix?.command ?? ''}</code>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {fixes.length === 0 && <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider text-center py-4">No fixes recommended</p>}
                  </div>
                </ScrollArea>

                <Separator className="bg-[hsl(120,50%,20%)] my-3" />

                <div className="space-y-2">
                  <Button
                    onClick={onApplyFixes}
                    disabled={selectedFixes.length === 0 || loading}
                    className="w-full bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] hover:bg-[hsl(120,100%,50%)] rounded-none font-bold tracking-wider text-xs uppercase disabled:opacity-40"
                  >
                    {loading ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Applying...</> : `Apply ${selectedFixes.length} Fix${selectedFixes.length !== 1 ? 'es' : ''} & Restart`}
                  </Button>
                  <Button
                    onClick={onRerunDiagnosis}
                    disabled={loading}
                    variant="outline"
                    className="w-full border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] hover:bg-[hsl(120,20%,10%)] rounded-none tracking-wider text-xs uppercase bg-transparent"
                  >
                    Re-run Diagnosis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
