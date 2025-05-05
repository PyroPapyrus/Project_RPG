'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

export function BackButton() {
  return (
    <Link href="/">
      <Button variant="ghost" size="sm" className="text-white hover:text-gray-800 hover:bg-white">
        <ArrowLeft className="h-7 w-7" />
      </Button>
    </Link>
  )
} 