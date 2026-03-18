import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { usuario } from './db/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const [user] = await db
          .select()
          .from(usuario)
          .where(eq(usuario.email, credentials.email.toLowerCase()))

        if (!user) return null

        const passwordOk = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!passwordOk) return null

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          familiaId: user.familiaId,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.familiaId = (user as unknown as { familiaId: string }).familiaId
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { familiaId: string }).familiaId = token.familiaId as string;
        (session.user as { id: string }).id = token.userId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

