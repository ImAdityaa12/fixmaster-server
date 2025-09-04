import { Router } from "express";
import { auth } from "../auth";
import { fromNodeHeaders } from "better-auth/node";
import { getCategory } from "../controllers/customers";

const router = Router();

router.get("/me", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    return res.json(session);
});

router.get('/categories', getCategory)

// You can add more API routes here
router.get("/status", (req, res) => {
    res.json({ status: "API is working ✅" });
});

export default router;
