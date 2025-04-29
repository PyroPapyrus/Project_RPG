'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

export function BackButton() {
  return (
    <Link href="/" className="">
      <Button variant="ghost" size="sm" className="hover:bg-gray-100">
        <ArrowLeft className="h-5 w-5" />
      </Button>
    </Link>
  )
} 