import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserLogin } from '@/types/api'

// Import API client dynamically to avoid SSR issues
const getApiClient = async () => {
  const { default: apiClient } = await import('@/lib/api')
  return apiClient
}

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: {
          label: 'Password',
          type: 'password'
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          const apiClient = await getApiClient()
          const loginData: UserLogin = {
            email: credentials.email as string,
            password: credentials.password as string
          }

          console.log('Attempting login with:', { email: loginData.email })
          const response = await apiClient.login(loginData)
          console.log('Login response received:', { hasToken: !!response.access_token, hasUser: !!response.user })

          if (response.access_token && response.user) {
            // Store the token in the API client
            apiClient.setToken(response.access_token)

            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              role: response.user.role,
              accessToken: response.access_token
            }
          }

          console.log('Login failed: Invalid response format')
          return null
        } catch (error) {
          console.error('Authentication error:', error)
          // If it's an axios error, log more details
          if (error && typeof error === 'object' && 'response' in error) {
            console.error('API response status:', error.response?.status)
            console.error('API response data:', error.response?.data)
          }
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout'
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token.accessToken) {
        session.accessToken = token.accessToken
        session.user.role = token.role

        // Set the token in API client on session creation (client-side only)
        if (typeof window !== 'undefined') {
          try {
            const apiClient = await getApiClient()
            apiClient.setToken(token.accessToken as string)
          } catch (error) {
            console.warn('Failed to set token in API client:', error)
          }
        }
      }
      return session
    }
  },
  session: {
    strategy: 'jwt'
  }
})