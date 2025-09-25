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
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - auth (auth pages)
    // - test (test page)
    // - root path (landing page)
    '/((?!api|_next/static|_next/image|favicon|auth|test|$).*)',
  ],
}