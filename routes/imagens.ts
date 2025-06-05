import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { v2 as cloudinary } from 'cloudinary'

const prisma = new PrismaClient()
const router = Router()

const imagemSchema = z.object({
  descricao: z.string().min(5, { message: "Descrição da imagem deve possuir, no mínimo, 5 caracteres" }),
  produtoId: z.coerce.number(),
})

router.get("/", async (req, res) => {
  try {
    const imagens = await prisma.imagem.findMany({
      include: {
        produto: true,
      },
    })
    res.status(200).json(imagens)
  } catch (error: any) {
    let mensagem = 'Erro desconhecido.'
    if (typeof error === 'string') mensagem = error
    else if (error?.message) mensagem = error.message
    else if (error?.meta?.cause) mensagem = error.meta.cause
    else mensagem = JSON.stringify(error)
    res.status(500).json({ erro: mensagem })
  }
})

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: 'dqgbg9e48',
  api_key: '821218884763488',
  api_secret: 'UOJ0mKTsZpirM6-w45gCpE99r_8',
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'revenda_noite',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    }
  },
})

const upload = multer({ storage })

router.post("/", upload.single('imagem'), async (req, res) => {
  const valida = imagemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  if (!req.file || !req.file.path) {
    res.status(400).json({ erro: "Imagem não enviada" })
    return
  }

  const { descricao, produtoId } = valida.data
  const urlImagem = req.file.path

  try {
    const imagem = await prisma.imagem.create({
      data: { descricao, produtoId, url: urlImagem },
    })
    res.status(201).json(imagem)
  } catch (error: any) {
    console.error('Erro ao cadastrar imagem:', error)
    let mensagem = 'Erro desconhecido.'
    if (typeof error === 'string') mensagem = error
    else if (error?.message) mensagem = error.message
    else if (error?.meta?.cause) mensagem = error.meta.cause
    else mensagem = JSON.stringify(error)
    res.status(400).json({ erro: mensagem })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const imagem = await prisma.imagem.delete({
      where: { id: Number(id) },
    })
    res.status(200).json(imagem)
  } catch (error: any) {
    let mensagem = 'Erro desconhecido.'
    if (typeof error === 'string') mensagem = error
    else if (error?.message) mensagem = error.message
    else if (error?.meta?.cause) mensagem = error.meta.cause
    else mensagem = JSON.stringify(error)
    res.status(400).json({ erro: mensagem })
  }
})


/*
router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const carro = await prisma.carro.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(carro)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = carroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { modelo, ano, preco, km, foto, acessorios,
    destaque, combustivel, marcaId } = valida.data

  try {
    const carro = await prisma.carro.update({
      where: { id: Number(id) },
      data: {
        modelo, ano, preco, km, foto, acessorios,
        destaque, combustivel, marcaId
      }
    })
    res.status(200).json(carro)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  // tenta converter para número
  const termoNumero = Number(termo)

  // is Not a Number, ou seja, se não é um número: filtra por texto
  if (isNaN(termoNumero)) {
    try {
      const carros = await prisma.carro.findMany({
        include: {
          marca: true,
        },
        where: {
          // mode: insensitive (para não diferenciar maiúsculas de minúsculas)
          // necessário no PostgreSQL (no MySQL é o padrão)
          OR: [
            { modelo: { contains: termo, mode: "insensitive" } },
            { marca: { nome: { equals: termo, mode: "insensitive" } } }
          ]
        }
      })
      res.status(200).json(carros)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  } else {
    if (termoNumero <= 3000) {
      try {
        const carros = await prisma.carro.findMany({
          include: {
            marca: true,
          },
          where: { ano: termoNumero }
        })
        res.status(200).json(carros)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    } else {
      try {
        const carros = await prisma.carro.findMany({
          include: {
            marca: true,
          },
          where: { preco: { lte: termoNumero } }
        })
        res.status(200).json(carros)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    }
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const carro = await prisma.carro.findUnique({
      where: { id: Number(id) },
      include: {
        marca: true
      }
    })
    res.status(200).json(carro)
  } catch (error) {
    res.status(400).json(error)
  }
})
*/
export default router
