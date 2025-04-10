// src/app/components/face-registration.tsx
'use client'
import { useState } from 'react'
import * as faceapi from 'face-api.js'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'

export default function FaceRegistration() {
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingStatus, setTrainingStatus] = useState('')

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {'image/*': []},
    maxFiles: 3
  })

  const trainFaceRecognizer = async () => {
    if (acceptedFiles.length < 3) return
    
    const descriptors = []
    setTrainingStatus('Processing images...')
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const img = await faceapi.bufferToImage(file)
      const detection = await faceapi.detectSingleFace(
        img, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor()
      
      if (detection) {
        descriptors.push(detection.descriptor)
      }
      setTrainingProgress((i + 1) / acceptedFiles.length * 100)
    }

    if (descriptors.length > 0) {
      const labeledDescriptors = [
        new faceapi.LabeledFaceDescriptors(
          'Registered Driver', 
          descriptors
        )
      ]
      localStorage.setItem('faceDescriptors', JSON.stringify(labeledDescriptors))
      setTrainingStatus('Training completed successfully!')
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <div {...getRootProps()} className="border-dashed border-2 p-4 text-center mb-4">
        <input {...getInputProps()} />
        <p>Drag & drop 3 face images here, or click to select</p>
      </div>
      
      {acceptedFiles.length > 0 && (
        <div className="mb-4">
          <Button onClick={trainFaceRecognizer}>
            Train Face Recognition Model
          </Button>
          <div className="mt-2">
            <p>Progress: {trainingProgress.toFixed(0)}%</p>
            <p>{trainingStatus}</p>
          </div>
        </div>
      )}
    </div>
  )
}