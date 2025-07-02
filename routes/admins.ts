import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const router = Router()

const adminSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  senha: z.string().min(6, { message: "Senha deve possuir, no mínimo, 6 caracteres" }),
  nivel: z.number().int().min(1).max(3).optional().default(2) // 1=Super Admin, 2=Admin, 3=Moderador
})

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  senha: z.string().min(1, { message: "Senha é obrigatória" })
})

// Rota para criar admin
router.post("/criar", async (req, res) => {
  const valida = adminSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.errors.map(e => e.message).join('; ') })
    return
  }

  const { nome, email, senha, nivel } = valida.data

  try {
    // Verifica se já existe admin com este email
    const adminExistente = await prisma.admin.findFirst({
      where: { email }
    })

    if (adminExistente) {
      res.status(400).json({ erro: "Este email já está cadastrado" })
      return
    }

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 12)

    const admin = await prisma.admin.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        nivel
      }
    })

    // Remove a senha da resposta
    const { senha: _, ...adminSemSenha } = admin

    res.status(201).json({
      mensagem: "Admin criado com sucesso!",
      admin: adminSemSenha
    })
  } catch (error: any) {
    let mensagem = 'Erro desconhecido.'
    if (typeof error === 'string') mensagem = error
    else if (error?.message) mensagem = error.message
    else if (error?.meta?.cause) mensagem = error.meta.cause
    else mensagem = JSON.stringify(error)
    res.status(400).json({ erro: mensagem })
  }
})

// Rota de login para admin
router.post("/login", async (req, res) => {
  const valida = loginSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.errors.map(e => e.message).join('; ') })
    return
  }

  const { email, senha } = valida.data

  try {
    const admin = await prisma.admin.findFirst({
      where: { email }
    })

    if (!admin) {
      res.status(401).json({ erro: "Email ou senha incorretos" })
      return
    }

    const senhaCorreta = await bcrypt.compare(senha, admin.senha)
    if (!senhaCorreta) {
      res.status(401).json({ erro: "Email ou senha incorretos" })
      return
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        nivel: admin.nivel 
      },
      process.env.JWT_KEY as string,
      { expiresIn: '8h' }
    )

    res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        nivel: admin.nivel
      }
    })
  } catch (error: any) {
    let mensagem = 'Erro desconhecido.'
    if (typeof error === 'string') mensagem = error
    else if (error?.message) mensagem = error.message
    else if (error?.meta?.cause) mensagem = error.meta.cause
    else mensagem = JSON.stringify(error)
    res.status(400).json({ erro: mensagem })
  }
})

// Listar todos os admins
router.get("/", async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        nivel: true,
        createdAt: true,
        updatedAt: true
      }
    })
    res.status(200).json(admins)
  } catch (error: any) {
    let mensagem = 'Erro desconhecido.'
    if (typeof error === 'string') mensagem = error
    else if (error?.message) mensagem = error.message
    else if (error?.meta?.cause) mensagem = error.meta.cause
    else mensagem = JSON.stringify(error)
    res.status(400).json({ erro: mensagem })
  }
})

export default router