import { NextAuthOptions, getServerSession } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

export const authOptions: NextAuthOptions = {
	providers: [
		AzureADProvider({
			clientId: process.env.AZURE_AD_CLIENT_ID || '',
			clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
			tenantId: process.env.AZURE_AD_TENANT_ID || '',
		}),
	],
	callbacks: {
		async session({ session, token }) {
			// Safely assign the user ID from the token
			if (session.user && token.sub) {
				session.user.id = token.sub // Assigning user ID safely
			}
			return session
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	theme: {
		colorScheme: 'light',
		logo: '/next.svg',
	},
}

export async function getSession() {
	return await getServerSession(authOptions)
}
