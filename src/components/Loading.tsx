'use client'

export function Loading() {
  return (
    <div className="flex fixed inset-0 z-[9999] bg-gray-900 items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
    </div>
  )
}