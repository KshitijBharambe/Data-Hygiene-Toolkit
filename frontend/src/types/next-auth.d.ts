import { DefaultSession, DefaultUser } from 'next-auth'
import { UserRole } from './api'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      role: UserRole
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    role?: UserRole
  }
}