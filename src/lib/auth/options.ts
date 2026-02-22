import type { NextAuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// Type augmentation — extends NextAuth session and JWT with UmojaHub fields
// ---------------------------------------------------------------------------

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    firstName: string;
  }
}

// ---------------------------------------------------------------------------
// authOptions — the single NextAuth configuration object
// Import this in: src/app/api/auth/[...nextauth]/route.ts
//                 Any API route calling getServerSession(authOptions)
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        // Lazy import to avoid importing mongoose at module load time in serverless
        const UserModel = (await import('@/lib/models/User.model')).default;

        const user = await UserModel.findOne({
          email: credentials.email.toLowerCase().trim(),
        }).select('+hashedPassword');

        if (!user || !user.hashedPassword) {
          // Constant-time compare to prevent timing attacks even on missing user
          await bcrypt.compare('dummy', '$2b$12$invalidhashfortimingprotection00000000000000000');
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          role: user.role as Role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      // `user` is only present on the initial sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.firstName = token.firstName;
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login', // Redirect auth errors back to login with ?error= param
  },

  // Suppress verbose NextAuth debug logs in production
  debug: process.env.NODE_ENV === 'development',
};
