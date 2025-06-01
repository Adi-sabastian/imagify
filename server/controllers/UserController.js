import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'

// API to register user
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' })
        }

        if (!email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Invalid email format' })
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create new user
        const newUser = await userModel.create({
            name,
            email,
            password: hashedPassword,
            creditBalance: 5 // Give 5 free credits to new users
        })

        // Generate JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                creditBalance: newUser.creditBalance
            }
        })
    } catch (error) {
        console.error('Registration error:', error)
        res.status(500).json({ success: false, message: 'Error registering user' })
    }
}

// API to login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' })
        }

        if (!email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Invalid email format' })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(401).json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
            res.status(200).json({
                success: true,
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    creditBalance: user.creditBalance
                }
            })
        }
        else {
            res.status(401).json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ success: false, message: 'Error logging in' })
    }
}

// API to get user credits
export const getUserCredits = async (req, res) => {
    try {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' })
        }

        const user = await userModel.findById(userId)

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        res.status(200).json({
            success: true,
            credits: user.creditBalance,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                creditBalance: user.creditBalance
            }
        })
    } catch (error) {
        console.error('Get credits error:', error)
        res.status(500).json({ success: false, message: 'Error fetching credits' })
    }
} 