"use client"

import { useRef, useEffect, useState } from "react"
import * as faceapi from "face-api.js"
import { useToast } from "@/components/ui/use-toast"
import type { UserProfile } from "@/types"
import { calculateEAR } from "@/lib/utils"

interface DrowsinessDetectorProps {
  isActive: boolean
  showVisualization: boolean
  userProfiles: UserProfile[]
  onDrowsinessStateChange: (isDrowsy: boolean) => void
  onUserRecognized: (user: UserProfile | null) => void
}

export default function DrowsinessDetector({
  isActive,
  showVisualization,
  userProfiles,
  onDrowsinessStateChange,
  onUserRecognized,
}: DrowsinessDetectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [eyeAspectRatio, setEyeAspectRatio] = useState(0)
  const [eyesClosed, setEyesClosed] = useState(false)
  const [drowsinessCounter, setDrowsinessCounter] = useState(0)
  const [isDrowsy, setIsDrowsy] = useState(false)
  const [recognizedUser, setRecognizedUser] = useState<UserProfile | null>(null)
  const [alertSound, setAlertSound] = useState<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  // Constants for drowsiness detection
  const EYE_AR_THRESHOLD = 0.2
  const EYE_CLOSED_FRAMES = 15
  const RECOGNITION_THRESHOLD = 0.6

  // Load face-api models
  useEffect(() => {
    async function loadModels() {
      try {
        // Use absolute URLs for model paths
        const modelPath = `${window.location.origin}/models`
        console.log("Loading models from:", modelPath)

        // Load models one by one with better error handling
        await faceapi.nets.tinyFaceDetector.load(modelPath).catch((e) => {
          throw new Error(`Failed to load tinyFaceDetector: ${e.message}`)
        })
        console.log("Loaded tinyFaceDetector model")

        await faceapi.nets.faceLandmark68Net.load(modelPath).catch((e) => {
          throw new Error(`Failed to load faceLandmark68Net: ${e.message}`)
        })
        console.log("Loaded faceLandmark68Net model")

        await faceapi.nets.faceRecognitionNet.load(modelPath).catch((e) => {
          throw new Error(`Failed to load faceRecognitionNet: ${e.message}`)
        })
        console.log("Loaded faceRecognitionNet model")

        setModelsLoaded(true)
        console.log("All face detection models loaded successfully")
      } catch (error) {
        console.error("Error loading face detection models:", error)
        toast({
          title: "Model Loading Error",
          description:
            "Failed to load face detection models. Please check your internet connection and refresh the page.",
          variant: "destructive",
        })
      }
    }

    loadModels()

    // Initialize alert sound
    const sound = new Audio("/alert.mp3")
    sound.loop = true
    setAlertSound(sound)

    return () => {
      if (alertSound) {
        alertSound.pause()
        alertSound.currentTime = 0
      }
    }
  }, [])

  // Update parent component when drowsiness state changes
  useEffect(() => {
    onDrowsinessStateChange(isDrowsy)
  }, [isDrowsy, onDrowsinessStateChange])

  // Update parent component when recognized user changes
  useEffect(() => {
    onUserRecognized(recognizedUser)
  }, [recognizedUser, onUserRecognized])

  // Handle drowsiness detection
  useEffect(() => {
    if (!isActive || !modelsLoaded) return

    let animationFrameId: number
    let videoElement: HTMLVideoElement | null = null
    let lastRecognitionTime = 0
    const recognitionInterval = 1000 // Perform recognition every 1 second

    const detectFaces = async () => {
      if (!canvasRef.current) return

      // Find the video element
      videoElement = document.querySelector("video")
      if (!videoElement || videoElement.paused || videoElement.ended) {
        animationFrameId = requestAnimationFrame(detectFaces)
        return
      }

      const canvas = canvasRef.current
      const displaySize = {
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      }

      // Match canvas size to video
      if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
        faceapi.matchDimensions(canvas, displaySize)
      }

      try {
        // Detect faces with landmarks
        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()

        // Clear canvas
        const ctx = canvas.getContext("2d")
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (detections.length > 0) {
          // Get the first detected face
          const detection = detections[0]
          const resizedDetection = faceapi.resizeResults(detection, displaySize)

          // Calculate eye aspect ratio
          const landmarks = resizedDetection.landmarks
          const leftEye = landmarks.getLeftEye()
          const rightEye = landmarks.getRightEye()

          const leftEAR = calculateEAR(leftEye)
          const rightEAR = calculateEAR(rightEye)
          const avgEAR = (leftEAR + rightEAR) / 2

          setEyeAspectRatio(avgEAR)

          // Check if eyes are closed
          const currentEyesClosed = avgEAR < EYE_AR_THRESHOLD
          setEyesClosed(currentEyesClosed)

          // Update drowsiness counter
          if (currentEyesClosed) {
            setDrowsinessCounter((prev) => prev + 1)
          } else {
            setDrowsinessCounter(0)
          }

          // Check for drowsiness
          if (drowsinessCounter >= EYE_CLOSED_FRAMES && !isDrowsy) {
            setIsDrowsy(true)
            if (alertSound) {
              alertSound.play().catch((e) => console.error("Error playing alert:", e))
            }
            toast({
              title: "DROWSINESS ALERT!",
              description: "Wake up! You appear to be drowsy.",
              variant: "destructive",
            })
          } else if (drowsinessCounter === 0 && isDrowsy) {
            setIsDrowsy(false)
            if (alertSound) {
              alertSound.pause()
              alertSound.currentTime = 0
            }
          }

          // Perform face recognition at intervals
          const currentTime = Date.now()
          if (currentTime - lastRecognitionTime > recognitionInterval && userProfiles.length > 0) {
            lastRecognitionTime = currentTime

            // Get face descriptor for the detected face
            const fullFaceDescription = await faceapi
              .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor()

            if (fullFaceDescription) {
              const currentDescriptor = fullFaceDescription.descriptor

              // Compare with stored face descriptors
              let bestMatch: { user: UserProfile; distance: number } | null = null

              for (const user of userProfiles) {
                if (user.faceDescriptors) {
                  for (const descriptor of user.faceDescriptors) {
                    const distance = faceapi.euclideanDistance(descriptor, currentDescriptor)

                    if (distance < RECOGNITION_THRESHOLD && (!bestMatch || distance < bestMatch.distance)) {
                      bestMatch = { user, distance }
                    }
                  }
                }
              }

              if (bestMatch) {
                if (!recognizedUser || recognizedUser.id !== bestMatch.user.id) {
                  setRecognizedUser(bestMatch.user)
                  toast({
                    title: "Driver Recognized",
                    description: `Hello, ${bestMatch.user.name}!`,
                  })
                }
              } else if (recognizedUser) {
                setRecognizedUser(null)
              }
            }
          }

          // Draw visualizations if enabled
          if (showVisualization && ctx) {
            // Draw face detection box
            ctx.strokeStyle = isDrowsy ? "red" : recognizedUser ? "green" : "yellow"
            ctx.lineWidth = 2
            ctx.strokeRect(
              resizedDetection.detection.box.x,
              resizedDetection.detection.box.y,
              resizedDetection.detection.box.width,
              resizedDetection.detection.box.height,
            )

            // Draw face landmarks
            drawFaceLandmarks(ctx, resizedDetection.landmarks.positions)

            // Draw user name if recognized
            if (recognizedUser) {
              ctx.font = "16px Arial"
              ctx.fillStyle = "green"
              ctx.fillText(recognizedUser.name, resizedDetection.detection.box.x, resizedDetection.detection.box.y - 5)
            }
          }
        } else {
          // Reset drowsiness if no face detected
          if (isDrowsy) {
            setIsDrowsy(false)
            if (alertSound) {
              alertSound.pause()
              alertSound.currentTime = 0
            }
          }
          setDrowsinessCounter(0)

          // Clear recognized user after a delay
          if (recognizedUser) {
            setTimeout(() => {
              setRecognizedUser(null)
            }, 3000)
          }
        }
      } catch (error) {
        console.error("Error in face detection:", error)
      }

      animationFrameId = requestAnimationFrame(detectFaces)
    }

    detectFaces()

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (isDrowsy && alertSound) {
        alertSound.pause()
        alertSound.currentTime = 0
      }
    }
  }, [isActive, modelsLoaded, showVisualization, drowsinessCounter, isDrowsy, alertSound, userProfiles])

  // Draw face landmarks
  const drawFaceLandmarks = (ctx: CanvasRenderingContext2D, landmarks: faceapi.Point[]) => {
    // Draw all landmarks as small dots
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    landmarks.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw eyes with different color
    const leftEyeIndices = [36, 37, 38, 39, 40, 41]
    const rightEyeIndices = [42, 43, 44, 45, 46, 47]

    ctx.fillStyle = eyesClosed ? "red" : "cyan"

    // Draw left eye landmarks
    leftEyeIndices.forEach((index) => {
      if (landmarks[index]) {
        ctx.beginPath()
        ctx.arc(landmarks[index].x, landmarks[index].y, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

    // Draw right eye landmarks
    rightEyeIndices.forEach((index) => {
      if (landmarks[index]) {
        ctx.beginPath()
        ctx.arc(landmarks[index].x, landmarks[index].y, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

    // Draw nose tip with different color
    if (landmarks[30]) {
      ctx.fillStyle = "red"
      ctx.beginPath()
      ctx.arc(landmarks[30].x, landmarks[30].y, 3, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw mouth landmarks with different color
    const mouthIndices = [48, 54, 57, 60]
    ctx.fillStyle = "magenta"
    mouthIndices.forEach((index) => {
      if (landmarks[index]) {
        ctx.beginPath()
        ctx.arc(landmarks[index].x, landmarks[index].y, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
  }

  return (
    <>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      {isDrowsy && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg animate-pulse text-xl font-bold">WAKE UP!</div>
        </div>
      )}
    </>
  )
}
