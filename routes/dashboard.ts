import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const produtos = await prisma.produto.count()
    const comentarios = await prisma.comentario.count()
    const marcas = await prisma.marca.count()
    res.status(200).json({ clientes, produtos, comentarios, marcas })
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/produtosMarca", async (req, res) => {
  try {
    const marcas = await prisma.marca.findMany({
      select: {
        nome: true,
        _count: {
          select: { produtos: true }
        }
      }
    })

    const marcas2 = marcas
        .filter(item => item._count.produtos > 0)
        .map(item => ({
            marca: item.nome,
            num: item._count.produtos
        }))
    res.status(200).json(marcas2)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/produtosCategoria", async (req, res) => {
  try {
    const produtos = await prisma.produto.groupBy({
      by: ['categoria'],
      _count: {
        categoria: true,
      },
    })

    const categorias = produtos.map(produto => ({
      categoria: produto.categoria,
      num: produto._count.categoria
    }))

    res.status(200).json(categorias)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/comentariosRecentes", async (req, res) => {
  try {
    const comentarios = await prisma.comentario.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        cliente: {
          select: {
            nome: true,
            email: true
          }
        },
        produto: {
          select: {
            nome: true
          }
        }
      }
    })

    res.status(200).json(comentarios)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/produtosDestaque", async (req, res) => {
  try {
    const produtosDestaque = await prisma.produto.count({
      where: {
        destaque: true
      }
    })

    const produtosTotal = await prisma.produto.count()

    res.status(200).json({ 
      destaque: produtosDestaque, 
      total: produtosTotal,
      porcentagem: Math.round((produtosDestaque / produtosTotal) * 100)
    })
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
