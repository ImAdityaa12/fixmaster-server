import 'dotenv/config'
import express, { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import cors from "cors";
import { fromNodeHeaders } from "better-auth/node";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: process.env.CLIENT_URL!, // Replace with your frontend's origin
        methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
        credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    })
);

app.all("/api/auth/*splat", toNodeHandler(auth));
// Middleware
app.use(express.json());

// Routes

app.get("/api/me", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    return res.json(session);
});

app.get("/", (req: Request, res: Response) => {
    res.send("Hello TypeScript + Express 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
