ALTER TABLE "Discount"
  ALTER COLUMN "code" DROP NOT NULL,
  ADD COLUMN "eventName" TEXT,
  ADD COLUMN "autoApply" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "startsAt" TIMESTAMP(3);

CREATE INDEX "Discount_autoApply_startsAt_idx" ON "Discount"("autoApply", "startsAt");

CREATE TABLE "DiscountProduct" (
  "discountId" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  CONSTRAINT "DiscountProduct_pkey" PRIMARY KEY ("discountId", "productId"),
  CONSTRAINT "DiscountProduct_discountId_fkey"
    FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DiscountProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DiscountProduct_productId_idx" ON "DiscountProduct"("productId");
