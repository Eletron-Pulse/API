import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from 'zod'
import nodemailer from "nodemailer"

const prisma = new PrismaClient()
const router = Router()

const comentarioSchema = z.object({
  clienteId: z.string(),
  produtoId: z.number(),
  texto: z.string().min(5, { message: "Comentário deve possuir, no mínimo, 5 caracteres" })
})

router.get("/", async (req, res) => {
  try {
    const comentarios = await prisma.comentario.findMany({
      include: {
        cliente: true,
        produto: true
      },
      orderBy: { id: 'desc'}
    })
    res.status(200).json(comentarios)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", async (req, res) => {
  const valida = comentarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }
  const { clienteId, produtoId, texto } = valida.data

  try {
    const comentario = await prisma.comentario.create({
      data: { clienteId, produtoId, texto }
    })
    res.status(201).json(comentario)
  } catch (error) {
    res.status(400).json(error)
  }
})

async function enviaEmail(nome: string, email: string, texto: string, resposta: string) {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    secure: false,
    auth: {
      user: "968f0dd8cc78d9",
      pass: "89ed8bfbf9b7f9"
    }
  });

  const info = await transporter.sendMail({
    from: 'sualoja@email.com', // sender address
    to: email, // list of receivers
    subject: "Resposta ao seu comentário - Loja de Eletrônicos", // Subject line
    text: resposta, // plain text body
    html: `<h3>Olá, ${nome}</h3>
           <h3>Comentário: ${texto}</h3>
           <h3>Resposta da Loja: ${resposta}</h3>
           <p>Obrigado pelo seu feedback!</p>
           <p>Equipe Loja de Eletrônicos</p>`
  });

  console.log("Message sent: %s", info.messageId);
}

router.patch("/:id", async (req, res) => {
  const { id } = req.params
  const { resposta } = req.body

  if (!resposta) {
    res.status(400).json({ "erro": "Informe a resposta deste comentário" })
    return
  }

  try {
    const comentario = await prisma.comentario.update({
      where: { id: Number(id) },
      data: { resposta }
    })

    const dados = await prisma.comentario.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true
      }
    })

    enviaEmail(dados?.cliente.nome as string,
      dados?.cliente.email as string,
      dados?.texto as string,
      resposta)

    res.status(200).json(comentario)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params
  try {
    const comentarios = await prisma.comentario.findMany({
      where: { clienteId },
      include: {
        produto: true
      }
    })
    res.status(200).json(comentarios)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const comentario = await prisma.comentario.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(comentario)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router