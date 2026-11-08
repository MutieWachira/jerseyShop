import { z } from "zod";
import { KitVersion, Size } from "@prisma/client";

export const productPriceSchema = z.number()
    .int("Price must be a whole number of Ksh")
    .positive("Price must be a positive number")
    .max(2_147_483_647, "Price exceeds the supported range");

export const createProductSchema = z.object({
    name: z.string().min(2, "Name too short"),
    team: z.string().min(2, "Team too short"),
    price: productPriceSchema,
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
});

export const productVariantsSchema = z.array(
    z.object({
        size: z.nativeEnum(Size),
        version: z.nativeEnum(KitVersion).default(KitVersion.FAN),
        stock: z.coerce.number().int().nonnegative().default(0),
    }),
);