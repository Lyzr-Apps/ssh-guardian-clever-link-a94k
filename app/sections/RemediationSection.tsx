'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { VscTerminal, VscWarning, VscCheck, VscClose, VscFolderOpened } from 'react-icons/vsc'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'

interface RemediationSectionProps {
  remediationResult: any
  loading: boolean
  onWatchHealth: () => void
  onNavigate: (screen: string) => void
  activeAgentId: string | null
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-xs text-[hsl(120,90%,55%)]">{line.slice(2)}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-xs text-[hsl(120,90%,55%)]">{line}</p>
      })}
    </div>
  )
}

export default function RemediationSection({
  remediationResult,
  loading,
  onWatchHealth,
  onNavigate,
  activeAgentId,
}: RemediationSectionProps) {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<number>>(new Set())
  const [confirmInputs, setConfirmInputs] = React.useState<Record<number, string>>({})

  const data = remediationResult?.response?.result
  const actions = Array.isArray(data?.actions_taken) ? data.actions_taken : []
  const skipped = Array.isArray(data?.skipped_actions) ? data.skipped_actions : []
  const restart = data?.service_restart
  const summary = data?.summary ?? ''

  const totalSteps = actions.length + skipped.length
  const completedSteps = actions.filter((a: any) => (a?.status ?? '').toLowerCase() === 'success' || (a?.status ?? '').toLowerCase() === 'completed').length
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const stepStatusIcon = (status: string) => {
    const s = (status ?? '').toLowerCase()
    if (s === 'success' || s === 'completed') return <VscCheck className="w-4 h-4 text-[hsl(120,100%,50%)]" />
    if (s === 'failed' || s === 'error') return <VscClose className="w-4 h-4 text-red-500" />
    return <div className="w-4 h-4 border border-amber-500 bg-amber-500/20 flex items-center justify-center text-amber-500 text-[8px]">?</div>
  }

  return (
    <div className="min-h-screen bg-[hsl(120,15%,3%)] font-mono relative">
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />
      <div className="relative z-20">
        {/* Header */}
        <div className="border-b border-[hsl(120,50%,20%)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('diagnosis')} className="text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] text-xs tracking-wider">&lt; BACK</button>
            <Separator orientation="vertical" className="h-4 bg-[hsl(120,50%,20%)]" />
            <h1 className="text-sm font-bold text-[hsl(120,100%,50%)] tracking-wider uppercase">Remediation</h1>
          </div>
          {activeAgentId && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(120,100%,50%)] animate-pulse" />
              <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">AGENT ACTIVE</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(120,100%,50%)] mx-auto" />
              <p className="text-xs text-[hsl(120,100%,50%)] tracking-wider">Executing remediation steps...</p>
              <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">Creating backups and applying fixes</p>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[hsl(120,60%,35%)] tracking-wider">PROGRESS: {completedSteps}/{totalSteps} STEPS COMPLETED</span>
                <span className="text-[hsl(120,100%,50%)] tracking-wider">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 rounded-none bg-[hsl(120,20%,10%)] [&>div]:bg-[hsl(120,100%,45%)]" />
            </div>

            {/* Actions Taken */}
            <div className="space-y-2">
              {actions.map((action: any, i: number) => (
                <Collapsible key={i} open={expandedSteps.has(i)} onOpenChange={() => toggleStep(i)}>
                  <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="py-2 px-3">
                        <div className="flex items-center gap-3">
                          {expandedSteps.has(i) ? <ChevronDown className="w-3 h-3 text-[hsl(120,60%,35%)]" /> : <ChevronRight className="w-3 h-3 text-[hsl(120,60%,35%)]" />}
                          {stepStatusIcon(action?.status ?? '')}
                          <span className="text-[10px] text-[hsl(120,100%,50%)] tracking-wider font-bold">STEP {action?.step_number ?? i + 1}</span>
                          <span className="text-[10px] text-[hsl(120,90%,55%)] flex-1 text-left truncate">{action?.action_description ?? ''}</span>
                          {action?.is_destructive && (
                            <VscWarning className="w-3 h-3 text-red-500 flex-shrink-0" />
                          )}
                          <Badge className={`rounded-none text-[9px] tracking-wider ${(action?.status ?? '').toLowerCase() === 'success' || (action?.status ?? '').toLowerCase() === 'completed' ? 'bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)]' : 'bg-red-500 text-white'}`}>
                            {(action?.status ?? 'UNKNOWN').toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-3 pb-3 space-y-2">
                        {action?.is_destructive && (
                          <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30">
                            <VscWarning className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-[10px] text-red-400 tracking-wider">DESTRUCTIVE OPERATION - This action modifies system files</span>
                          </div>
                        )}
                        <div>
                          <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider uppercase mb-1">Command Executed:</p>
                          <code className="block text-[10px] text-[hsl(120,100%,50%)] bg-[hsl(120,15%,3%)] p-2 border border-[hsl(120,50%,20%)] break-all">{action?.command_executed ?? ''}</code>
                        </div>
                        {action?.output && (
                          <div>
                            <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider uppercase mb-1">Output:</p>
                            <pre className="text-[10px] text-[hsl(120,90%,55%)] bg-[hsl(120,15%,3%)] p-2 border border-[hsl(120,50%,20%)] whitespace-pre-wrap break-all max-h-32 overflow-auto">{action.output}</pre>
                          </div>
                        )}
                        {action?.backup_path && (
                          <div className="flex items-center gap-2 text-[10px] text-[hsl(120,60%,35%)] tracking-wider">
                            <VscFolderOpened className="w-3 h-3" />
                            Backup: <span className="text-[hsl(120,100%,50%)]">{action.backup_path}</span>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>

            {/* Skipped Actions */}
            {skipped.length > 0 && (
              <Card className="bg-[hsl(120,12%,5%)] border-amber-500/30 rounded-none">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-amber-500 text-xs tracking-wider uppercase">Skipped Actions ({skipped.length})</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {skipped.map((s: any, i: number) => (
                    <div key={i} className="border border-amber-500/20 bg-amber-500/5 p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-500 tracking-wider font-bold">STEP {s?.step_number ?? i}</span>
                        <span className="text-[10px] text-amber-400">{s?.action_description ?? ''}</span>
                      </div>
                      <p className="text-[9px] text-amber-400/70 mt-1 tracking-wider">Reason: {s?.reason ?? 'Unknown'}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Service Restart */}
            {restart && (
              <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                    <VscTerminal className="w-3 h-3" /> Service Restart
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">Status:</span>
                    <Badge className={`rounded-none text-[9px] tracking-wider ${(restart?.status ?? '').toLowerCase() === 'success' || (restart?.status ?? '').toLowerCase() === 'completed' ? 'bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)]' : 'bg-red-500 text-white'}`}>
                      {(restart?.status ?? 'UNKNOWN').toUpperCase()}
                    </Badge>
                  </div>
                  {restart?.timestamp && (
                    <p className="text-[9px] text-[hsl(120,60%,35%)] tracking-wider">Timestamp: {restart.timestamp}</p>
                  )}
                  {restart?.output && (
                    <pre className="text-[10px] text-[hsl(120,90%,55%)] bg-[hsl(120,15%,3%)] p-2 border border-[hsl(120,50%,20%)] whitespace-pre-wrap break-all">{restart.output}</pre>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {summary && (
              <div className="p-3 border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)]">
                <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider uppercase mb-1">Summary</p>
                {renderMarkdown(summary)}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onWatchHealth}
                className="flex-1 bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] hover:bg-[hsl(120,100%,50%)] rounded-none font-bold tracking-wider text-xs uppercase"
              >
                <VscTerminal className="mr-2 w-3 h-3" /> Watch Health
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
        )}

        {!loading && !data && (
          <div className="flex items-center justify-center py-20">
            <p className="text-xs text-[hsl(120,60%,35%)] tracking-wider">No remediation results yet. Run diagnosis first.</p>
          </div>
        )}
      </div>
    </div>
  )
}
