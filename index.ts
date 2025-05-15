import express from 'express'
import cors from 'cors'
import routeProdutos from './routes/produtos' // Corrigido o nome da importação
import routeImagens from './routes/imagens' // Corrigido o nome da importação

const app = express()
const port = 3001

app.use(express.json())
app.use(cors())

app.use("/produtos", routeProdutos) // Corrigido o nome da variável usada
app.use("/imagens", routeImagens) // Corrigido o nome da variável us

app.get('/', (req, res) => {
  res.send('API: Eletron Pulse')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})