//https://next-auth.js.org/configuration/nextjs

export { default } from 'next-auth/middleware'

export const config = {
	matcher: ['/((?!api|_next|static|.*\\..*|favicon.ico).*)'],
}
