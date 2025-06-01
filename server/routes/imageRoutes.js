import express from 'express'
import { generateImage, testClipdropAPI } from '../controllers/imageController.js'
import authUser from '../middlewares/auth.js'

const router = express.Router()

// Test Clipdrop API connection
router.get('/test-api', testClipdropAPI)

// Generate image route
router.post('/generate-image', authUser, generateImage)

export default router