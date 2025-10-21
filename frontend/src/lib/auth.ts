import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import { UserLogin } from "@/types/api";

// Import API client dynamically to avoid SSR issues
const getApiClient = async () => {
  const { default: apiClient } = await import("@/lib/api");
  return apiClient;
};

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your@email.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const apiClient = await getApiClient();
          const loginData: UserLogin = {
            email: credentials.email as string,
            password: credentials.password as string,
          };

          const response = await apiClient.login(loginData);

          if (response.access_token && response.user) {
            // Store the token in the API client
            apiClient.setToken(response.access_token);

            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              role: response.user.role,
              accessToken: response.access_token,
            };
          }

          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: User & { accessToken?: string; role?: string };
    }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken;
        if (token.role) {
          session.user.role = token.role;
        }

        // Set the token in API client on session creation (client-side only)
        if (typeof window !== "undefined") {
          try {
            const apiClient = await getApiClient();
            apiClient.setToken(token.accessToken as string);
          } catch {
            // Silently fail - token will be set on next API call
          }
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1 year in seconds (effectively indefinite for demo)
  },
});
