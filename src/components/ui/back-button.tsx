'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

interface BackButtonProps {
  href: string;
}

export function BackButton({ href }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className="rounded-full py-[21px] text-white hover:text-gray-800 hover:bg-white">
        <ArrowLeft className="h-7 w-7" />
      </Button>
    </Link>
  )
}