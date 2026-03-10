import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(2, "Name too short"),
    team: z.string().min(2, "Team too short"),
    price: z.number().int().positive("Price must be a positive number"),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
});