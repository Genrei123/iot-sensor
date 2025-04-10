"use client"

import { useState, useEffect } from "react"
import CameraView from "@/components/camera-view"
import DrowsinessDetector from "@/components/drowsiness-detector"
import PhotoUpload from "@/components/photo-upload"
import StatusDisplay from "@/components/status-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Info, Camera, User } from "lucide-react"
import type { UserProfile, DetectionState } from "@/types"

export default function Home() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showVisualization, setShowVisualization] = useState(true)
  const [activeTab, setActiveTab] = useState("camera")
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [detectionState, setDetectionState] = useState<DetectionState>({
    isActive: false,
    showVisualization: true,
    isDrowsy: false,
    recognizedUser: null,
    eyeAspectRatio: 0,
    alertCount: 0,
  })
  const { toast } = useToast()

  // Load user profiles from localStorage on component mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem("userProfiles")
    if (savedProfiles) {
      try {
        const parsedProfiles = JSON.parse(savedProfiles)
        setUserProfiles(parsedProfiles)
      } catch (error) {
        console.error("Error parsing saved profiles:", error)
      }
    }
  }, [])

  // Save user profiles to localStorage when they change
  useEffect(() => {
    if (userProfiles.length > 0) {
      localStorage.setItem("userProfiles", JSON.stringify(userProfiles))
    }
  }, [userProfiles])

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      // Check if camera permissions are already granted
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => {
          setHasPermission(true)
        })
        .catch(() => {
          setHasPermission(false)
        })
    }
  }, [])

  useEffect(() => {
    const handleToggleEvent = () => {
      toggleVisualization()
    }

    document.addEventListener("toggleVisualization", handleToggleEvent)
    return () => {
      document.removeEventListener("toggleVisualization", handleToggleEvent)
    }
  }, [showVisualization])

  // Add a useEffect to check if models are loaded
  useEffect(() => {
    // Check if face-api.js models are loaded
    const checkModelsLoaded = async () => {
      try {
        // Check if the models directory exists and is accessible
        const response = await fetch("/models/tiny_face_detector_model-weights_manifest.json")
        if (!response.ok) {
          throw new Error(`Failed to access model file: ${response.statusText}`)
        }

        // Try to parse the JSON to verify it's valid
        await response.json()
        console.log("Model manifest file is accessible and valid")
      } catch (error) {
        console.error("Error checking model files:", error)
        toast({
          title: "Model Files Error",
          description:
            "Face detection model files are missing or invalid. Please ensure the models are correctly placed in the public/models directory.",
          variant: "destructive",
        })
      }
    }

    checkModelsLoaded()
  }, [toast])

  const handleCameraReady = () => {
    setCameraReady(true)
    toast({
      title: "Camera Ready",
      description: "Your camera is now active and ready for drowsiness detection.",
    })
  }

  const toggleVisualization = () => {
    setShowVisualization(!showVisualization)
    setDetectionState((prev) => ({
      ...prev,
      showVisualization: !showVisualization,
    }))
    toast({
      title: `Face Visualization ${!showVisualization ? "Enabled" : "Disabled"}`,
      description: `Face tracking visualization has been ${!showVisualization ? "enabled" : "disabled"}.`,
    })
  }

  const startProcessing = () => {
    setIsProcessing(true)
    setDetectionState((prev) => ({
      ...prev,
      isActive: true,
    }))
    toast({
      title: "Detection Started",
      description: "Drowsiness detection is now active.",
    })
  }

  const stopProcessing = () => {
    setIsProcessing(false)
    setDetectionState((prev) => ({
      ...prev,
      isActive: false,
      isDrowsy: false,
    }))
    toast({
      title: "Detection Stopped",
      description: "Drowsiness detection has been paused.",
    })
  }

  const handleUserProfileCreated = (profile: UserProfile) => {
    setUserProfiles((prev) => [...prev, profile])
  }

  const handleDrowsinessStateChange = (isDrowsy: boolean) => {
    setDetectionState((prev) => ({
      ...prev,
      isDrowsy,
      alertCount: isDrowsy ? prev.alertCount + 1 : prev.alertCount,
    }))
  }

  const handleUserRecognized = (user: UserProfile | null) => {
    setDetectionState((prev) => ({
      ...prev,
      recognizedUser: user,
    }))
  }

  const handleModelsLoaded = () => {
    setModelsLoaded(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-2 text-center">Drowsiness Detection System</h1>
      <p className="text-gray-600 mb-6 text-center max-w-2xl">
        Monitor driver alertness in real-time using advanced face tracking and eye state analysis
      </p>

      {hasPermission === null ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4">Checking camera permissions...</p>
        </div>
      ) : !hasPermission ? (
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <Camera className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Camera Access Required</h2>
              <p className="text-center mb-4">
                This application needs access to your camera to detect drowsiness and recognize faces.
              </p>
              <Button
                onClick={async () => {
                  try {
                    await navigator.mediaDevices.getUserMedia({ video: true })
                    setHasPermission(true)
                  } catch (error) {
                    console.error("Error requesting camera permission:", error)
                  }
                }}
              >
                Grant Camera Access
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <User className="text-gray-500" size={18} />
              <span className="text-sm text-gray-500">
                {userProfiles.length} {userProfiles.length === 1 ? "Profile" : "Profiles"} Registered
              </span>
            </div>
            <PhotoUpload onUserProfileCreated={handleUserProfileCreated} modelsLoaded={modelsLoaded} />
          </div>

          <Tabs defaultValue="camera" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Camera View</TabsTrigger>
              <TabsTrigger value="info">Information</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="mt-4">
              <Card className="border-2">
                <CardContent className="p-0 relative">
                  <div className="aspect-video relative bg-black rounded-md overflow-hidden">
                    <CameraView onCameraReady={handleCameraReady} showVisualization={showVisualization} />

                    {cameraReady && (
                      <DrowsinessDetector
                        isActive={isProcessing}
                        showVisualization={showVisualization}
                        userProfiles={userProfiles}
                        onDrowsinessStateChange={handleDrowsinessStateChange}
                        onUserRecognized={handleUserRecognized}
                      />
                    )}
                  </div>

                  <StatusDisplay
                    isActive={isProcessing}
                    showVisualization={showVisualization}
                    isDrowsy={detectionState.isDrowsy}
                    recognizedUser={detectionState.recognizedUser}
                    eyeAspectRatio={detectionState.eyeAspectRatio}
                    alertCount={detectionState.alertCount}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-between">
                <Button onClick={toggleVisualization} variant="outline" className="flex-1">
                  {showVisualization ? "Hide" : "Show"} Face Tracking
                </Button>

                <Button
                  onClick={isProcessing ? stopProcessing : startProcessing}
                  variant={isProcessing ? "destructive" : "default"}
                  className="flex-1"
                  disabled={!cameraReady}
                >
                  {isProcessing ? "Stop Detection" : "Start Detection"}
                </Button>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p className="flex items-center gap-1">
                  <span className="text-yellow-500">•</span> Press{" "}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Enter</kbd> to toggle face visualization
                </p>
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Info size={18} /> About This System
                  </h3>
                  <p className="mb-4">
                    This drowsiness detection system uses computer vision to monitor driver alertness by tracking facial
                    features and eye movements.
                  </p>

                  <h4 className="font-medium mt-4 mb-2">How It Works:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Face detection identifies the driver's face</li>
                    <li>Eye aspect ratio (EAR) is calculated to determine eye openness</li>
                    <li>Consecutive frames with closed eyes trigger drowsiness alerts</li>
                    <li>The system recognizes registered drivers from uploaded photos</li>
                  </ul>

                  <h4 className="font-medium mt-4 mb-2">Face Recognition:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Upload at least 3 photos of your face from different angles</li>
                    <li>The system creates a face profile based on these photos</li>
                    <li>When driving, the system will automatically recognize you</li>
                    <li>This helps track drowsiness patterns for specific drivers</li>
                  </ul>

                  <h4 className="font-medium mt-4 mb-2">Controls:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Start/Stop Detection - Activates drowsiness monitoring</li>
                    <li>Show/Hide Face Tracking - Toggles visualization overlay</li>
                    <li>Press Enter key to quickly toggle visualization</li>
                    <li>Create Face Profile - Add your face to the recognition system</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  )
}
