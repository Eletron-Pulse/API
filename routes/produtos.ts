import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const produtoSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  categoria: z.string().min(2, { message: "Categoria deve possuir, no mínimo, 2 caracteres" }),
  descricao: z.string().nullable().optional(),
  preco: z.number(),
  estoque: z.number(),
  imagem: z.string(),
  destaque: z.boolean().optional(),
  marcaId: z.number(),
})

router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: { marca: true }
    })
    res.status(200).json(produtos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, categoria, descricao = null, preco, estoque, imagem, destaque = false, marcaId } = valida.data

  try {
    const produto = await prisma.produto.create({
      data: {
        nome,
        categoria,
        descricao,
        preco,
        estoque,
        imagem,
        destaque,
        marcaId
      }
    })
    res.status(201).json(produto)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const produto = await prisma.produto.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, categoria, descricao, preco, estoque, imagem, destaque, marcaId } = valida.data

  try {
    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { nome, categoria, descricao, preco, estoque, imagem, destaque, marcaId }
    })
    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  // tenta converter para número
  const termoNumero = Number(termo)

  // is Not a Number, ou seja, se não é um número: filtra por texto
  if (isNaN(termoNumero)) {
    try {
      const produtos = await prisma.produto.findMany({
        include: {
          marca: true,
        },
        where: {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } }, // Pesquisa por nome
            { categoria: { contains: termo, mode: "insensitive" } }, // Pesquisa por categoria
            { marca: { nome: { contains: termo, mode: "insensitive" } } } // Pesquisa por nome da marca
          ]
        }
      })
      res.status(200).json(produtos)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  } else {
    try {
      const produtos = await prisma.produto.findMany({
        include: {
          marca: true,
        },
        where: { preco: { lte: termoNumero } } // Pesquisa por preço menor ou igual ao termo
      })
      res.status(200).json(produtos)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: Number(id) },
      include: { marca: true, imagens: true },
    });
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

export default router
