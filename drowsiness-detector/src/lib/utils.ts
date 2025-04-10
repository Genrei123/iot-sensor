import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate Eye Aspect Ratio (EAR)
export function calculateEAR(eye: { x: number; y: number }[]) {
  if (eye.length < 6) return 1.0

  // Calculate vertical distances
  const A = euclideanDistance(eye[1], eye[5])
  const B = euclideanDistance(eye[2], eye[4])

  // Calculate horizontal distance
  const C = euclideanDistance(eye[0], eye[3])

  // Calculate EAR
  if (C < 0.001) return 1.0 // Avoid division by zero
  return (A + B) / (2.0 * C)
}

// Calculate Euclidean distance between two points
export function euclideanDistance(pt1: { x: number; y: number }, pt2: { x: number; y: number }) {
  return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2))
}
