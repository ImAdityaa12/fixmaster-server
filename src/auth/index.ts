import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    emailAndPassword: {
        enabled: true,
    },
    // It is recommended to use secure cookies for production
    // advanced: {
    //     cookies: {
    //         session_token: {
    //             attributes: {
    //                 secure: process.env.ENVIROMENT === "production"
    //             }
    //         },
    //     }
    // }
});