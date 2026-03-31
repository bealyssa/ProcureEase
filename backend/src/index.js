const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('reflect-metadata')

const { AppDataSource } = require('./config/dataSource')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const departmentRoutes = require('./routes/departments')
const purchaseRequestRoutes = require('./routes/purchaseRequests')
const purchaseOrderRoutes = require('./routes/purchaseOrders')
const auditLogRoutes = require('./routes/auditLogs')

const app = express()

const allowedOrigins = ['http://localhost:5173']

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
)
app.use(express.json())

app.get('/', (req, res) => {
    res.send('ProcureEase Backend Running')
})

app.get('/health', (req, res) => {
    res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/purchase-requests', purchaseRequestRoutes)
app.use('/api/purchase-orders', purchaseOrderRoutes)
app.use('/api/audit-logs', auditLogRoutes)

const port = Number(process.env.PORT || 5000)

AppDataSource.initialize()
    .then(() => {
        console.log('Database connected (TypeORM)')

        app.listen(port, '0.0.0.0', () => {
            console.log(`Server running at http://0.0.0.0:${port}`)
        })
    })
    .catch((err) => {
        console.error('DB init error:', err)
        process.exitCode = 1
    })
