import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()
const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(10,
    { message: "Nome deve possuir, no mínimo, 10 caracteres" }),
  email: z.string().email(),
  senha: z.string()
})

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(400).json(error)
  }
})

function validaSenha(senha: string) {

  const mensa: string[] = []

  // .length: retorna o tamanho da string (da senha)
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  // contadores
  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  // senha = "abc123"
  // letra = "a"

  // percorre as letras da variável senha
  for (const letra of senha) {
    // expressão regular
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }

  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }

  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)")
  }

  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)")
  }

  return mensa
}

router.post("/", async (req, res) => {

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.errors.map(e => e.message).join('; ') })
    return
  }

  // Verifica se já existe cliente com o mesmo e-mail
  const clienteExistente = await prisma.cliente.findUnique({ where: { email: valida.data.email } })
  if (clienteExistente) {
    res.status(400).json({ erro: "E-mail já cadastrado no sistema." })
    return
  }

  const erros = validaSenha(valida.data.senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = bcrypt.genSaltSync(12)
  // gera o hash da senha acrescida do salt
  const hash = bcrypt.hashSync(valida.data.senha, salt)

  const { nome, email } = valida.data

  // para o campo senha, atribui o hash gerado
  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, senha: hash }
    })
    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Rota para solicitar recuperação de senha
router.post("/recuperar-senha", async (req, res) => {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ erro: "Informe o e-mail do cliente" })
    return
  }
  const cliente = await prisma.cliente.findUnique({ where: { email } })
  if (!cliente) {
    res.status(400).json({ erro: "E-mail não encontrado" })
    return
  }
  // Gera código de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  await prisma.cliente.update({ where: { email }, data: { recoveryCode: codigo } })
  // Envia e-mail
  console.log('Preparando para enviar e-mail de recuperação para:', email)
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 465,
    secure: false,
    auth: { user: "24de1d54b385f4", pass: "e50818f155a231" },
    connectionTimeout: 10000,
    tls: { rejectUnauthorized: false }
  })
  try {
    await transporter.sendMail({
      from: 'sualoja@email.com',
      to: email,
      subject: "Recuperação de senha - Loja de Eletrônicos",
      text: `Seu código de recuperação é: ${codigo}`,
      html: `<h3>Seu código de recuperação é: <b>${codigo}</b></h3>`
    })
    console.log('E-mail enviado com sucesso para:', email)
    res.status(200).json({ mensagem: "Código de recuperação enviado para o e-mail." })
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err)
    res.status(500).json({ erro: "Erro ao enviar e-mail de recuperação. Tente novamente mais tarde." })
  }
})

// Rota para alterar senha usando código de recuperação
router.post("/alterar-senha", async (req, res) => {
  const { email, codigo, novaSenha, repetirSenha } = req.body
  if (!email || !codigo || !novaSenha || !repetirSenha) {
    res.status(400).json({ erro: "Preencha todos os campos" })
    return
  }
  if (novaSenha !== repetirSenha) {
    res.status(400).json({ erro: "As senhas não conferem" })
    return
  }
  const cliente = await prisma.cliente.findUnique({ where: { email } })
  if (!cliente || cliente.recoveryCode !== codigo) {
    res.status(400).json({ erro: "Código de recuperação inválido" })
    return
  }
  const erros = validaSenha(novaSenha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }
  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(novaSenha, salt)
  await prisma.cliente.update({ where: { email }, data: { senha: hash, recoveryCode: null } })
  res.status(200).json({ mensagem: "Senha alterada com sucesso!" })
})

export default router