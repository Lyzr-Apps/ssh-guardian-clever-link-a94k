'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { VscTerminal, VscCheck, VscClose, VscCopy } from 'react-icons/vsc'
import { Loader2 } from 'lucide-react'

interface DiagnosisSectionProps {
  diagnosisResult: any
  loading: boolean
  onRerunDiagnosis: () => void
  onNavigate: (screen: string) => void
  activeAgentId: string | null
  connectionDetails: { ip: string; username: string; password: string }
}

export default function DiagnosisSection({
  diagnosisResult,
  loading,
  onRerunDiagnosis,
  onNavigate,
  activeAgentId,
  connectionDetails,
}: DiagnosisSectionProps) {
  const [copied, setCopied] = React.useState(false)

  const data = diagnosisResult?.response?.result
  const command = data?.command ?? 'service motadata status'
  const terminalOutput = data?.terminal_output ?? ''
  const exitCode = data?.exit_code ?? ''
  const status = data?.status ?? ''
  const machineIp = data?.machine_ip ?? connectionDetails.ip ?? ''
  const timestamp = data?.timestamp ?? ''

  const isSuccess = status === 'success' || exitCode === '0'

  const handleCopy = () => {
    if (terminalOutput) {
      navigator.clipboard.writeText(terminalOutput).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(120,15%,3%)] font-mono relative">
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />

      <div className="relative z-20">
        {/* Header */}
        <div className="border-b border-[hsl(120,50%,20%)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] text-xs tracking-wider">&lt; BACK</button>
            <Separator orientation="vertical" className="h-4 bg-[hsl(120,50%,20%)]" />
            <h1 className="text-sm font-bold text-[hsl(120,100%,50%)] tracking-wider uppercase flex items-center gap-2">
              <VscTerminal className="w-4 h-4" /> Terminal Output
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {activeAgentId && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(120,100%,50%)] animate-pulse" />
                <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">AGENT ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(120,100%,50%)] mx-auto" />
              <p className="text-xs text-[hsl(120,100%,50%)] tracking-wider">Connecting via SSH...</p>
              <p className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">Running: service motadata status</p>
            </div>
          </div>
        )}

        {/* Terminal Output */}
        {!loading && data && (
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {/* Connection Info Bar */}
            <div className="flex items-center justify-between p-3 border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">HOST:</span>
                  <span className="text-xs text-[hsl(120,100%,50%)] tracking-wider font-bold">{machineIp}</span>
                </div>
                <Separator orientation="vertical" className="h-3 bg-[hsl(120,50%,20%)]" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">USER:</span>
                  <span className="text-xs text-[hsl(120,100%,50%)] tracking-wider">{connectionDetails.username}</span>
                </div>
                {timestamp && (
                  <>
                    <Separator orientation="vertical" className="h-3 bg-[hsl(120,50%,20%)]" />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider">TIME:</span>
                      <span className="text-xs text-[hsl(120,90%,55%)] tracking-wider">{timestamp}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isSuccess ? (
                  <Badge className="bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] rounded-none text-[9px] tracking-wider flex items-center gap-1">
                    <VscCheck className="w-3 h-3" /> EXIT 0
                  </Badge>
                ) : (
                  <Badge className="bg-red-500 text-white rounded-none text-[9px] tracking-wider flex items-center gap-1">
                    <VscClose className="w-3 h-3" /> EXIT {exitCode}
                  </Badge>
                )}
              </div>
            </div>

            {/* Command Display */}
            <div className="p-2 border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)]">
              <div className="flex items-center gap-2">
                <span className="text-[hsl(120,60%,35%)] text-xs">$</span>
                <span className="text-[hsl(120,100%,50%)] text-xs tracking-wider font-bold">{command}</span>
              </div>
            </div>

            {/* Raw Terminal Output */}
            <Card className="bg-[hsl(120,12%,5%)] border-[hsl(120,50%,20%)] rounded-none">
              <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
                <CardTitle className="text-[hsl(120,100%,50%)] text-xs tracking-wider uppercase flex items-center gap-2">
                  <VscTerminal className="w-3 h-3" /> Output
                </CardTitle>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] tracking-wider transition-colors"
                >
                  <VscCopy className="w-3 h-3" />
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="max-h-[500px]">
                  <div className="bg-[hsl(120,15%,3%)] border border-[hsl(120,50%,20%)] p-4 min-h-[200px]">
                    <pre className="text-[11px] text-[hsl(120,90%,55%)] whitespace-pre-wrap break-words leading-relaxed tracking-wider">
                      {terminalOutput || 'No output received'}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onRerunDiagnosis}
                disabled={loading}
                className="flex-1 bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] hover:bg-[hsl(120,100%,50%)] rounded-none font-bold tracking-wider text-xs uppercase"
              >
                <VscTerminal className="mr-2 w-3 h-3" /> Re-run Command
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

        {/* No data state */}
        {!loading && !data && (
          <div className="flex items-center justify-center py-20">
            <p className="text-xs text-[hsl(120,60%,35%)] tracking-wider">No output yet. Run diagnosis from the dashboard.</p>
          </div>
        )}
      </div>
    </div>
  )
}
