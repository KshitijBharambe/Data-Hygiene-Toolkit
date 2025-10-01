import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware() {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/auth/login',
      signOut: '/auth/signout',
      error: '/auth/error',
    }
  }
)

export const config = {
  matcher: [
    // Protect specific routes (dashboard, data, rules, etc)
    '/dashboard/:path*',
    '/data/:path*',
    '/rules/:path*',
    '/executions/:path*',
    '/issues/:path*',
    '/reports/:path*',
    '/admin/:path*',
    '/search/:path*',
  ],
}