"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Appbar } from "@repo/ui/appbar";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeProvider";

export function AppbarClient() {
  const session = useSession();
  const router = useRouter();

  return (
    <Appbar
      onSignin={signIn}
      onSignout={async () => {
        await signOut();
        router.push("/api/auth/signin");
      }}
      user={session.data?.user}
      themeToggle={<ThemeToggle />}
    />
  );
}
