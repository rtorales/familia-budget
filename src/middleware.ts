export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/((?!login|registro|api/auth|api/registro|_next/static|_next/image|favicon.ico).*)',
  ],
}
