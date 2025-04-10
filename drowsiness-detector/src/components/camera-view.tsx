"use client"

import { useRef, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface CameraViewProps {
  onCameraReady: () => void
  showVisualization: boolean
}

export default function CameraView({ onCameraReady, showVisualization }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function setupCamera() {
      try {
        // Try to get the user's camera with the best possible settings for face detection
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user", // Use front camera on mobile devices
          },
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current
                .play()
                .then(() => {
                  setLoading(false)
                  onCameraReady()
                })
                .catch((err) => {
                  setError("Failed to play video: " + err.message)
                  setLoading(false)
                })
            }
          }
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err)
        setError("Camera access error: " + err.message)
        setLoading(false)
      }
    }

    setupCamera()

    // Cleanup function to stop the camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [onCameraReady])

  // Handle keyboard events for toggling visualization
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        // This will be handled by the parent component
        document.dispatchEvent(new CustomEvent("toggleVisualization"))
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-white mt-2">Initializing camera...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="bg-white p-4 rounded-md max-w-xs">
            <p className="text-red-500 font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2">
              Please ensure your camera is connected and you've granted permission to use it.
            </p>
          </div>
        </div>
      )}

      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
    </div>
  )
}
