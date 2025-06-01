import express from 'express'
import { registerUser, loginUser, getUserCredits } from '../controllers/UserController.js'
import authUser from '../middlewares/auth.js'

const router = express.Router()

// Register user route
router.post('/register', registerUser)

// Login user route
router.post('/login', loginUser)

// Get user credits route
router.get('/credits', authUser, getUserCredits)

export default router