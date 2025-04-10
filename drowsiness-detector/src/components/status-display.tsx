"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, AlertTriangle, User } from "lucide-react"
import type { UserProfile } from "@/types"

interface StatusDisplayProps {
  isActive: boolean
  showVisualization: boolean
  isDrowsy: boolean
  recognizedUser: UserProfile | null
  eyeAspectRatio: number
  alertCount: number
}

export default function StatusDisplay({
  isActive,
  showVisualization,
  isDrowsy,
  recognizedUser,
  eyeAspectRatio,
  alertCount,
}: StatusDisplayProps) {
  const [fps, setFps] = useState(0)
  const [cpuUsage, setCpuUsage] = useState(0)

  // Simulate performance metrics
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      // Simulate FPS between 15-30
      setFps(Math.floor(Math.random() * 15) + 15)

      // Simulate CPU usage between 20-60%
      setCpuUsage(Math.floor(Math.random() * 40) + 20)
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive])

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 text-sm">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? "default" : "outline"} className="h-6">
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>

          <Badge variant={showVisualization ? "secondary" : "outline"} className="h-6 flex items-center gap-1">
            {showVisualization ? <Eye size={12} /> : <EyeOff size={12} />}
            {showVisualization ? "Visualization ON" : "Visualization OFF"}
          </Badge>

          {isDrowsy && (
            <Badge variant="destructive" className="h-6 animate-pulse">
              DROWSY
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <span className="text-xs">CPU: {cpuUsage}%</span>
              <Progress value={cpuUsage} className="w-20 h-2" />
              <span className="text-xs">FPS: {fps}</span>
            </>
          )}
        </div>
      </div>

      {isActive && (
        <div className="mt-2 flex flex-wrap justify-between items-center">
          <div>
            <span className="font-medium text-xs mr-2">Driver:</span>
            <Badge variant={!recognizedUser ? "destructive" : "success"} className="h-5 flex items-center gap-1">
              <User size={10} />
              {recognizedUser ? recognizedUser.name : "Unidentified"}
            </Badge>
            {eyeAspectRatio > 0 && <span className="ml-2 text-xs">EAR: {eyeAspectRatio.toFixed(2)}</span>}
          </div>

          <div className="flex items-center gap-1">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span className="text-xs">Alerts: {alertCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}
