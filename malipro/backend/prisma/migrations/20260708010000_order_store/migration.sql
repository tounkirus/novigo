-- Lie une commande à une boutique (file des commandes commerçant).
ALTER TABLE "Order" ADD COLUMN "storeId" TEXT;
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
