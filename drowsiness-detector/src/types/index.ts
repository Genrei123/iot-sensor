export interface UserProfile {
    id: string
    name: string
    photos: string[] // Base64 encoded images
    faceDescriptors?: Float32Array[]
  }
  
  export interface DetectionState {
    isActive: boolean
    showVisualization: boolean
    isDrowsy: boolean
    recognizedUser: UserProfile | null
    eyeAspectRatio: number
    alertCount: number
  }
  