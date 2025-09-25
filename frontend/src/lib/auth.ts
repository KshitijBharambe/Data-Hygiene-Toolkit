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
  debug: process.env.NODE_ENV === 'development',
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
          console.log("Missing credentials");
          return null;
        }

        try {
          const apiClient = await getApiClient();
          const loginData: UserLogin = {
            email: credentials.email as string,
            password: credentials.password as string,
          };

          console.log("Attempting login with:", { email: loginData.email });
          const response = await apiClient.login(loginData);
          console.log("Login response received:", {
            hasToken: !!response.access_token,
            hasUser: !!response.user,
          });

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

          console.log("Login failed: Invalid response format");
          return null;
        } catch (error: unknown) {
          console.error("Authentication error:", error);
          // If it's an axios error, log more details
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as {
              response?: { status?: number; data?: unknown };
              message?: string;
            };
            console.error("API response status:", axiosError.response?.status);
            console.error("API response data:", axiosError.response?.data);

            // Handle specific error cases
            if (axiosError.response?.status === 502) {
              console.error("502 Bad Gateway: Backend API server is unreachable");
            }
          } else if (error && typeof error === "object" && "message" in error) {
            console.error("Network error:", (error as Error).message);
          }
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
    async jwt({ token, user }: { token: JWT; user?: User & { accessToken?: string; role?: string } }) {
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
          } catch (error) {
            console.warn("Failed to set token in API client:", error);
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
