"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { UserProfile } from "@/types"
import { X, Plus, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import * as faceapi from "face-api.js"

interface PhotoUploadProps {
  onUserProfileCreated: (profile: UserProfile) => void
  modelsLoaded: boolean
}

export default function PhotoUpload({ onUserProfileCreated, modelsLoaded }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [userName, setUserName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setPhotos((prevPhotos) => [...prevPhotos, event.target.result as string])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index))
  }

  // Update the handleSubmit function to handle model loading errors
  const handleSubmit = async () => {
    if (photos.length < 3) {
      toast({
        title: "Not enough photos",
        description: "Please upload at least 3 photos of your face from different angles",
        variant: "destructive",
      })
      return
    }

    if (!userName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      })
      return
    }

    if (!modelsLoaded) {
      toast({
        title: "Models not loaded",
        description:
          "Face detection models are still loading or failed to load. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Process each photo to extract face descriptors
      const descriptors: Float32Array[] = []

      for (const photo of photos) {
        try {
          const img = await createImageFromBase64(photo)
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (detections) {
            descriptors.push(detections.descriptor)
          }
        } catch (e) {
          console.error("Error detecting face:", e)
        }
      }

      if (descriptors.length === 0) {
        throw new Error("No faces detected in the uploaded photos. Please try with clearer photos of your face.")
      }

      // Create user profile
      const userProfile: UserProfile = {
        id: Date.now().toString(),
        name: userName,
        photos: photos,
        faceDescriptors: descriptors,
      }

      // Pass the profile to the parent component
      onUserProfileCreated(userProfile)

      // Close dialog and reset state
      setIsDialogOpen(false)
      setPhotos([])
      setUserName("")

      toast({
        title: "Profile created",
        description: `Face profile for ${userName} has been created successfully`,
      })
    } catch (error) {
      console.error("Error processing face photos:", error)
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : "Failed to process face photos",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const createImageFromBase64 = (base64: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = base64
      img.crossOrigin = "anonymous"
    })
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
        <User size={16} />
        Create Face Profile
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Your Face Profile</DialogTitle>
            <DialogDescription>
              Upload at least 3 photos of your face from different angles for better recognition.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Face Photos ({photos.length}/3 minimum)</label>

              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Face ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {photos.length < 5 && (
                  <Card
                    className="aspect-square flex items-center justify-center cursor-pointer hover:bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <Plus size={24} className="text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                    </CardContent>
                  </Card>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <div className="text-xs text-gray-500">
              <p>Tips for better recognition:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Ensure good lighting</li>
                <li>Include different angles (front, slight left, slight right)</li>
                <li>Keep a neutral expression</li>
                <li>Avoid wearing glasses if possible</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={photos.length < 3 || !userName.trim() || isProcessing}>
              {isProcessing ? "Processing..." : "Create Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
