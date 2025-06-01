import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './configs/mongodb.js'
import userRouter from './routes/userRoutes.js'
import imageRouter from './routes/imageRoutes.js'

// Configure environment variables
dotenv.config()

// Check required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'CLIPDROP_API'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Create express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)

// Connect to database
connectDB()

// Start server
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log('Environment variables loaded:', {
        MONGODB_URI: !!process.env.MONGODB_URI,
        JWT_SECRET: !!process.env.JWT_SECRET,
        CLIPDROP_API: !!process.env.CLIPDROP_API
    });
})
