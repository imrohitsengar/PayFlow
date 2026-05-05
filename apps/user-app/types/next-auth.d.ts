import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    // eslint-disable-line no-unused-vars
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // eslint-disable-line no-unused-vars
    sub?: string;
  }
}
