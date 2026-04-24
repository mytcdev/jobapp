import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "admin" | "manager" | "staff" | "client" | "user";
      staffId?: string;
      onboardingComplete?: boolean;
    };
  }
}
