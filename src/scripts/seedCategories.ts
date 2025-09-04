import "dotenv/config";
import { db } from "../db/index.js";
import { categories } from "../db/schema.js";

interface Service {
    id: string;
    title: string;
    icon: string;
    description: string;
    color: string;
}

const services: Service[] = [
    {
        id: "1",
        title: "Air Conditioning",
        icon: "snow-outline",
        description: "AC repair & maintenance",
        color: "#3B82F6",
    },
    {
        id: "2",
        title: "Refrigerator",
        icon: "cube-outline",
        description: "Fridge repair & service",
        color: "#10B981",
    },
    {
        id: "3",
        title: "Washing Machine",
        icon: "refresh-circle-outline",
        description: "Washer repair & parts",
        color: "#8B5CF6",
    },
    {
        id: "4",
        title: "Television",
        icon: "tv-outline",
        description: "TV repair & installation",
        color: "#F59E0B",
    },
    {
        id: "5",
        title: "Microwave",
        icon: "radio-outline",
        description: "Microwave repair service",
        color: "#EF4444",
    },
    {
        id: "6",
        title: "Electrical Wiring",
        icon: "flash-outline",
        description: "Electrical installations",
        color: "#06B6D4",
    },
];

async function seedCategories() {
    try {
        console.log("🌱 Seeding categories...");

        for (const service of services) {
            await db.insert(categories).values({
                id: service.id,
                name: service.title,
                icon: service.icon,
                description: service.description,
                isActive: true,
                parentId: null,
            }).onConflictDoNothing();
        }

        console.log("✅ Categories seeded successfully!");
    } catch (error) {
        console.error("❌ Error seeding categories:", error);
    } finally {
        process.exit(0);
    }
}

seedCategories();