import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import translationRouter from './routes/translation.js'
import historyRouter from './routes/history.js'
import favoritesRouter from './routes/favorites.js'

const app = express()
const PORT = process.env.PORT || 8000

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json({ limit: '1mb' }))

app.use('/api', translationRouter)
app.use('/api/history', historyRouter)
app.use('/api/favorites', favoritesRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ detail: 'An unexpected error occurred. Please try again later.' })
})

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
  console.log(`✅ In-memory store active — history & favorites enabled`)
})
