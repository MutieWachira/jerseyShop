ALTER TABLE "Product" ADD COLUMN "year" INTEGER;

CREATE INDEX "Product_year_idx" ON "Product"("year");
