-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "productID" TEXT NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Variant_productID_size_key" ON "Variant"("productID", "size");

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productID_fkey" FOREIGN KEY ("productID") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
