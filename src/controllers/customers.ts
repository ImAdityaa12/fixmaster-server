import { Request, Response } from "express";
import { db } from "../db";
import { categories } from "../db/schema";

export const getCategory = async (req: Request, res: Response) => {
    try {
        const allCategories = await db.select().from(categories);
        return res.json(allCategories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
    }
}