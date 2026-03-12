import NextAuth, { type AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"

import { PrismaAdapter } from "@auth/prisma-adapter"
import {prisma} from "@/src/lib/prisma"
import bcrypt from "bcrypt"

export const authOptions: AuthOptions = {
 adapter: PrismaAdapter(prisma),

 providers: [

  GoogleProvider({
   clientId: process.env.GOOGLE_CLIENT_ID as string,
   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  }),

  AppleProvider({
   clientId: process.env.APPLE_ID as string,
   clientSecret: process.env.APPLE_SECRET as string,
  }),

  CredentialsProvider({
   name: "Credentials",

   credentials: {
    email: {},
    password: {},
   },

   async authorize(credentials: Record<string, string> | undefined) {
    if (!credentials) throw new Error("Missing credentials")

    const user = await prisma.user.findUnique({
     where: { email: credentials.email }
    })

    if (!user) throw new Error("User not found")

    const valid = await bcrypt.compare(
     credentials.password,
     user.password
    )

    if (!valid) throw new Error("Invalid password")

    return user
   }
  })
 ],

 session: {
  strategy: "jwt"
 },

 secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }