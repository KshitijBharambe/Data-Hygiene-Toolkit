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
    // Protect all routes except static files, API, and auth
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|auth).*)',
  ],
}