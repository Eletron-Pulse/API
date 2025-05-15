-- CreateTable
CREATE TABLE "imagens" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(30) NOT NULL,
    "produtoId" INTEGER NOT NULL,

    CONSTRAINT "imagens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "imagens" ADD CONSTRAINT "imagens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
