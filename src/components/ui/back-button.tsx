'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'
import { cn } from '@/lib/utils';

interface BackButtonProps {
  href: string;
  className?: string;
}

export function BackButton({ href, className }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className={cn(className, "rounded-full py-[21px] text-white hover:text-gray-800 hover:bg-white")}>
        <ArrowLeft className="h-7 w-7" />
      </Button>
    </Link>
  )
}