import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lista de rotas públicas que não requerem autenticação
const publicRoutes = ['/', '/login', '/signup']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

    // Se for uma rota pública, permite o acesso
    if (isPublicRoute) {
      return res
    }

    // Se não for rota pública e não tiver sessão, redireciona para o login
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Erro no middleware:', error)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/campaigns/:path*',
    '/characters/:path*',
    '/rules/:path*'
  ]
} 