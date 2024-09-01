# Next.js authentication with next-auth

This guide will help you configure NextAuth to authenticate users via Azure Active Directory and protect all pages of your application, if you're using the App Router feature in Next.js 13+ (including Next.js 14).

This project is using pnpm. We assume that the project is using an `src` directory.

### Step 1: Set Up Azure AD for Authentication

1. **Register an App in Azure AD**:

   - Go to the [Azure Portal](https://portal.azure.com/) and navigate to **Azure Active Directory** > **App registrations** > **New registration**.
   - Name your app, set the redirect URI to `http://localhost:3000/api/auth/callback/azure-ad`, and register it.
   - After registration, go to **Certificates & secrets** and create a new client secret. Note down the secret value.
   - Under **Authentication**, ensure the redirect URI is added and set to "Web" type.
   - Note the **Application (client) ID** and **Directory (tenant) ID** from the **Overview** page.

2. **API Permissions**:
   - Go to **API permissions** and add the following permissions:
     - Microsoft Graph > Delegated permissions > `email`, `openid`, `profile`.
   - Grant admin consent for the permissions.

### Step 2: Install NextAuth.js

In your Next.js app, install the necessary dependencies:

```bash
pnpm install next-auth
```

### Step 3: Configure NextAuth with Azure AD

1. **Create a new API route** for NextAuth in the App Router structure. Place this file under `app/api/auth/[...nextauth]/route.ts`.

   ```typescript
   // src/app/api/auth/[...nextauth]/route.ts
   import NextAuth, { NextAuthOptions } from 'next-auth'
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
   }

   const handler = NextAuth(authOptions)

   export { handler as GET, handler as POST }
   ```

To avoid TypeScript errors, you need to extend the default `Session` and `User` types in NextAuth. This can be done by creating a new file to add custom types.

2. **Create a `next-auth.d.ts` file** in your project to extend the default types:

   ```typescript
   // src/types/next-auth.d.ts
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
   ```

3. **Ensure TypeScript uses this type file** by adding it to your `tsconfig.json` under the `include` or `typeRoots`:

   ```json
   // tsconfig.json
   {
   	"compilerOptions": {
   		"target": "esnext",
   		"lib": ["dom", "dom.iterable", "esnext"],
   		"allowJs": true,
   		"skipLibCheck": true,
   		"strict": true,
   		"forceConsistentCasingInFileNames": true,
   		"noEmit": true,
   		"esModuleInterop": true,
   		"moduleResolution": "node",
   		"resolveJsonModule": true,
   		"isolatedModules": true,
   		"jsx": "preserve",
   		"incremental": true
   	},
   	"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "src/types/next-auth.d.ts"],
   	"exclude": ["node_modules"]
   }
   ```

### Step 4: Set Environment Variables

Create a `.env.local` file in the root of your project with the following environment variables:

```plaintext
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=your_tenant_id
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

Replace `your_client_id`, `your_client_secret`, and `your_tenant_id` with the values obtained from Azure AD.

### Step 5: Protecting Pages in the App Router

To protect pages, you can use a `middleware.ts` file to enforce authentication across your entire app or selectively for certain routes.

#### Create a Middleware to Protect Routes

Create a `middleware.ts` file in the root of your project:

```typescript
// src/middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
```

This middleware will run on every route except for specific paths like `/api`, Next.js internal paths (`/_next`), and static files. It will check if the user is authenticated and redirect to the sign-in page if they are not.

### Step 6: Access the Session in Server Components

To access the session in server components, use the `getServerSession` function from NextAuth. This approach works well since server components can directly work with the session data on the server.

Here's how you can protect your server components and check for session data:

1. **Create a Helper to Fetch Session**:

   Create a helper to fetch the session on the server:

   ```typescript
   // src/lib/auth.ts
   import { getServerSession } from 'next-auth'
   import { authOptions } from '@/app/api/auth/[...nextauth]/route'

   export async function getSession() {
   	return await getServerSession(authOptions)
   }
   ```

2. **Use the Helper in a Server Component**:

   Now, you can use this helper in any server component to protect it:

   ```typescript
   // src/app/page.tsx (or any other server component)
   import { getSession } from '@/lib/auth'

   export default async function HomePage() {
   	const session = await getSession()

   	// Check if the user is authenticated
   	if (!session) {
   		return <p>You must be logged in to access this page.</p>
   	}

   	return <div>Welcome, {session.user?.name}!</div>
   }
   ```

3. **Handling Authentication States**:

   - **Unauthenticated Users**: You can choose to redirect them to the sign-in page, show a message, or handle the state as per your app’s requirements.
   - **Authenticated Users**: Display personalized content based on the session data.

### Step 7: Use the Session in Client Components

1. Create a **Logout Button** client component:

   Since server components don’t handle events like button clicks directly, you need a client component to trigger the logout.

   ```typescript
   // src/app/components/LogoutButton.tsx
   'use client'

   import { signOut } from 'next-auth/react'

   export default function LogoutButton() {
   	const handleLogout = () => {
   		signOut({
   			callbackUrl: '/', // Redirect to this URL after logging out (e.g., home page)
   		})
   	}

   	return (
   		<button onClick={handleLogout} className='bg-red-500 text-white px-4 py-2 rounded'>
   			Logout
   		</button>
   	)
   }
   ```

2. Create a **User Profile**: client component:

   Use the `useSession` hook to access the session data in your components:

   ```typescript
   // src/app/components/UserProfile.tsx (or any other component/page)
   'use client'

   import { useSession } from 'next-auth/react'

   export default function UserProfile() {
   	const { data: session, status } = useSession()

   	if (status === 'loading') {
   		return <p>Loading...</p>
   	}

   	if (!session) {
   		return <p>You are not logged in.</p>
   	}

   	return <div>Welcome, {session.user?.name}!</div>
   }
   ```

3. Create a **Wrapper** using a **Session Provider**

   ```typescript
   'use client'

   import { SessionProvider } from 'next-auth/react'
   import { PropsWithChildren } from 'react'

   export default function Wrapper({ children }: PropsWithChildren) {
   	return <SessionProvider>{children}</SessionProvider>
   }
   ```

4. Wrap the children with the **Wrapper** in `layout.tsx`

   ```typescript
   export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
   	return (
   		<html lang='en'>
   			<body className={inter.className}>
   				<header className='flex items-center justify-between p-4'>
   					<Wrapper>
   						<UserProfile />
   						<LogoutButton />
   					</Wrapper>
   				</header>
   				<main>{children}</main>
   			</body>
   		</html>
   	)
   }
   ```

### Summary

1. **Azure AD Setup**: Register your application, configure secrets, and set permissions in Azure.
2. **NextAuth Configuration**: Use the Azure AD provider in NextAuth.
3. **Middleware Protection**: Create a middleware to protect routes.
4. **Access Session in Server Components**: Use getServerSession to check authentication state directly in server components.
5. **Access Session in Client Components**: Use the `useSession` hook in components to manage user state.

This setup ensures that all pages are protected with Azure AD authentication in a Next.js 14 App Router environment using NextAuth.js.
