'use client'

import React, { useState } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { VscTerminal, VscCopy, VscCheck, VscClose, VscKey, VscRemote } from 'react-icons/vsc'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const AGENT_ID = '69a27b78e558069e826f040c'

export default function Page() {
  const [ip, setIp] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [command, setCommand] = useState('')
  const [exitCode, setExitCode] = useState('')
  const [status, setStatus] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const canRun = ip.trim() !== '' && username.trim() !== '' && password.trim() !== ''

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    setOutput(null)
    try {
      const message = `SSH into machine ${ip} with username=${username} and run the command: service motadata status. Return the exact raw terminal output.`
      const result = await callAIAgent(message, AGENT_ID)
      if (result.success) {
        const data = result.response?.result
        setCommand(data?.command ?? 'service motadata status')
        setOutput(data?.terminal_output ?? result.response?.message ?? 'No output returned')
        setExitCode(data?.exit_code ?? '')
        setStatus(data?.status ?? '')
        setTimestamp(data?.timestamp ?? new Date().toLocaleString())
      } else {
        setError(result?.error ?? 'Agent call failed')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }

  const isSuccess = status === 'success' || exitCode === '0'

  return (
    <div className="min-h-screen bg-[hsl(120,15%,3%)] text-[hsl(120,100%,50%)] font-mono relative">
      {/* Scanline */}
      <div className="pointer-events-none fixed inset-0 z-10" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />

      <div className="relative z-20 max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[hsl(120,50%,20%)] pb-4">
          <VscTerminal className="w-6 h-6 text-[hsl(120,100%,50%)]" />
          <div>
            <h1 className="text-lg font-bold tracking-wider uppercase">Motadata SSH Terminal</h1>
            <p className="text-[hsl(120,60%,35%)] text-xs tracking-wider">Connect via SSH and run: service motadata status</p>
          </div>
        </div>

        {/* SSH Connection Form */}
        <div className="border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)] p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-[hsl(120,60%,35%)] tracking-wider uppercase border-b border-[hsl(120,50%,20%)] pb-2">
            <VscRemote className="w-3 h-3" /> SSH Connection
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* IP */}
            <div className="space-y-1">
              <label className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider uppercase">IP Address</label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full bg-[hsl(120,15%,3%)] border border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] text-xs px-3 py-2 font-mono tracking-wider placeholder:text-[hsl(120,60%,25%)] focus:outline-none focus:border-[hsl(120,100%,45%)]"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider uppercase">Username</label>
              <div className="relative">
                <VscKey className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[hsl(120,60%,35%)]" />
                <input
                  type="text"
                  placeholder="root"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[hsl(120,15%,3%)] border border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] text-xs pl-7 pr-3 py-2 font-mono tracking-wider placeholder:text-[hsl(120,60%,25%)] focus:outline-none focus:border-[hsl(120,100%,45%)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] text-[hsl(120,60%,35%)] tracking-wider uppercase">Password / Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="credentials"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[hsl(120,15%,3%)] border border-[hsl(120,50%,20%)] text-[hsl(120,100%,50%)] text-xs px-3 py-2 pr-8 font-mono tracking-wider placeholder:text-[hsl(120,60%,25%)] focus:outline-none focus:border-[hsl(120,100%,45%)]"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)]">
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={!canRun || loading}
            className="w-full bg-[hsl(120,100%,45%)] text-[hsl(120,15%,3%)] py-2.5 text-xs font-bold tracking-wider uppercase disabled:opacity-30 hover:bg-[hsl(120,100%,50%)] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : (
              <><VscTerminal className="w-4 h-4" /> Run: service motadata status</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-500/40 bg-red-500/10 p-3 flex items-center justify-between">
            <span className="text-xs text-red-400 tracking-wider">ERROR: {error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs tracking-wider">X</button>
          </div>
        )}

        {/* Terminal Output */}
        {output !== null && (
          <div className="border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)] space-y-0">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(120,50%,20%)] bg-[hsl(120,20%,8%)]">
              <div className="flex items-center gap-4 text-[10px] tracking-wider">
                <span className="text-[hsl(120,60%,35%)]">HOST: <span className="text-[hsl(120,100%,50%)] font-bold">{ip}</span></span>
                <span className="text-[hsl(120,60%,35%)]">USER: <span className="text-[hsl(120,100%,50%)]">{username}</span></span>
                {timestamp && <span className="text-[hsl(120,60%,35%)]">TIME: <span className="text-[hsl(120,90%,55%)]">{timestamp}</span></span>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-[hsl(120,60%,35%)] hover:text-[hsl(120,100%,50%)] tracking-wider"
                >
                  <VscCopy className="w-3 h-3" />
                  {copied ? 'COPIED' : 'COPY'}
                </button>
                {isSuccess ? (
                  <span className="flex items-center gap-1 text-[10px] text-[hsl(120,100%,50%)] tracking-wider font-bold">
                    <VscCheck className="w-3 h-3" /> EXIT 0
                  </span>
                ) : exitCode ? (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 tracking-wider font-bold">
                    <VscClose className="w-3 h-3" /> EXIT {exitCode}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Command Prompt */}
            <div className="px-3 py-2 border-b border-[hsl(120,50%,15%)] bg-[hsl(120,15%,4%)]">
              <span className="text-[hsl(120,60%,35%)] text-xs">{username}@{ip}:~$ </span>
              <span className="text-[hsl(120,100%,50%)] text-xs font-bold">{command}</span>
            </div>

            {/* Output */}
            <div className="p-4 bg-[hsl(120,15%,3%)] max-h-[500px] overflow-y-auto">
              <pre className="text-[11px] text-[hsl(120,90%,55%)] whitespace-pre-wrap break-words leading-relaxed tracking-wide">{output}</pre>
            </div>
          </div>
        )}

        {/* Loading terminal animation */}
        {loading && (
          <div className="border border-[hsl(120,50%,20%)] bg-[hsl(120,12%,5%)]">
            <div className="px-3 py-2 border-b border-[hsl(120,50%,15%)] bg-[hsl(120,15%,4%)]">
              <span className="text-[hsl(120,60%,35%)] text-xs">{username || 'user'}@{ip || 'host'}:~$ </span>
              <span className="text-[hsl(120,100%,50%)] text-xs font-bold">service motadata status</span>
            </div>
            <div className="p-4 bg-[hsl(120,15%,3%)]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[hsl(120,100%,50%)] animate-pulse tracking-wider">Waiting for response</span>
                <span className="text-xs text-[hsl(120,100%,50%)] animate-pulse">...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
