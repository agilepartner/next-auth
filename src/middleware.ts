import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
	// Get the token from the request
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

	// If token is not present, redirect to sign-in page
	if (!token) {
		const signInUrl = new URL('/api/auth/signin', request.url)
		return NextResponse.redirect(signInUrl)
	}

	// Allow the request if the user is authenticated
	return NextResponse.next()
}

// Specify the paths to be protected
export const config = {
	matcher: ['/((?!api|_next|static|.*\\..*|favicon.ico).*)'],
}
