import { DefaultSession, DefaultUser } from 'next-auth'

// Extend the default user type
declare module 'next-auth' {
	interface Session {
		user: {
			id: string // Add `id` property to the session user
		} & DefaultSession['user']
	}

	interface User extends DefaultUser {
		id: string // Add `id` property to the user
	}
}
