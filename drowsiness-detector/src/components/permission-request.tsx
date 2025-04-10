'use client'
import { Button } from "@/components/ui/button"

export default function PermissionRequest() {
  const requestAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      window.location.reload()
    } catch (error) {
      console.error('Camera access denied')
    }
  }

  return (
    <div className="text-center p-8">
      <Button onClick={requestAccess}>
        Enable Camera Access
      </Button>
    </div>
  )
}