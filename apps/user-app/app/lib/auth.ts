import db from "@repo/db/client";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import { z } from "zod";
import type { AuthOptions } from "next-auth";
import { env } from "./env";

const credentialsSchema = z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
    password: z.string().min(3, "Password must be at least 3 characters"),
});


export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                phone: { label: "Phone number", type: "text", placeholder: "1231231231", required: true },
                password: { label: "Password", type: "password", required: true }
            },
            async authorize(credentials) {
                // Validate input with Zod
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) {
                    console.error("Validation failed:", parsed.error.flatten());
                    return null;
                }

                const { phone, password } = parsed.data;
                // Only look up the user first; don't hash until we know we need to create
                const existingUser = await db.user.findFirst({
                    where: {
                        number: phone
                    }
                });

                if (existingUser) {
                    const passwordValidation = await bcrypt.compare(password, existingUser.password);
                    if (passwordValidation) {
                        return {
                            id: existingUser.id.toString(),
                            name: existingUser.name,
                            email: existingUser.number
                        }
                    }
                    return null;
                }

                // Hash only when creating a new user
                const hashedPassword = await bcrypt.hash(password, 10);

                try {
                    // Create user and their Balance record in a transaction
                    const user = await db.$transaction(async (tx) => {
                        const newUser = await tx.user.create({
                            data: {
                                number: phone,
                                password: hashedPassword
                            }
                        });

                        // Create a Balance record so balance queries never return null
                        await tx.balance.create({
                            data: {
                                userId: newUser.id,
                                amount: 0,
                                locked: 0
                            }
                        });

                        return newUser;
                    });

                    return {
                        id: user.id.toString(),
                        name: user.name,
                        email: user.number
                    }
                } catch (e) {
                    console.error(e);
                }

                return null
            },
        })
    ],
    secret: env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/api/auth/signin",
    },
    callbacks: {
        async session({ token, session }) {
            if (session.user) {
                session.user.id = token.sub;
            }

            return session
        }
    }
}