import "next-auth";

declare module "next-auth" {
  interface User {
    role: "admin" | "instructor";
    color?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "instructor";
      color?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "instructor";
    color?: string | null;
  }
}
