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
    // Protect all routes except:
    // - Public static files
    // - API routes
    // - Auth pages
    // - Landing page
    '/((?!api/|_next/|favicon|manifest.json|auth/|test|$).*)',
  ],
}