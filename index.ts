import express from 'express'
import cors from 'cors'
import routesProdutos from './routes/produtos'
import routesImagens from './routes/imagens'
import routesClientes from './routes/Clientes'
import routesLogin from './routes/login'
import routesComentarios from './routes/comentarios'
import routesMarcas from './routes/marcas'
import routesDashboard from './routes/dashboard'
import routesAdmin from './routes/admins'

const app = express()
const port = 3001

app.use(express.json())
app.use(cors())

app.use("/produtos", routesProdutos)
app.use("/imagens", routesImagens)
app.use("/clientes", routesClientes)
app.use("/clientes/login", routesLogin)
app.use("/comentarios", routesComentarios)
app.use("/marcas", routesMarcas)
app.use("/dashboard", routesDashboard)
app.use("/admins", routesAdmin) // Apenas /admins (sem /admin)

app.get('/', (req, res) => {
  res.send('API: Loja de Eletrônicos')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})