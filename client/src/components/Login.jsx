import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'

const Login = () => {

    const [state, setState] = useState('Login')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const { backendUrl, setShowLogin, setToken, setUser } = useContext(AppContext)

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            console.log('Attempting to', state.toLowerCase(), 'with:', { email, password: '***' })
            console.log('Backend URL:', backendUrl)

            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            if (state === 'Login') {
                const response = await axios.post(
                    `${backendUrl}/api/user/login`, 
                    { email, password },
                    config
                )
                console.log('Login response:', response.data)

                if (response.data.success) {
                    setToken(response.data.token)
                    setUser(response.data.user)
                    localStorage.setItem('token', response.data.token)
                    setShowLogin(false)
                    toast.success('Login successful!')
                } else {
                    toast.error(response.data.message || 'Login failed')
                }
            } else {
                const response = await axios.post(
                    `${backendUrl}/api/user/register`, 
                    { name, email, password },
                    config
                )
                console.log('Register response:', response.data)

                if (response.data.success) {
                    setToken(response.data.token)
                    setUser(response.data.user)
                    localStorage.setItem('token', response.data.token)
                    setShowLogin(false)
                    toast.success('Registration successful!')
                } else {
                    toast.error(response.data.message || 'Registration failed')
                }
            }
        } catch (error) {
            console.error('Error:', error)
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response data:', error.response.data)
                console.error('Response status:', error.response.status)
                toast.error(error.response.data.message || 'Server error occurred')
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request)
                toast.error('Unable to connect to the server. Please check if the server is running.')
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message)
                toast.error(error.message || 'An error occurred')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Disable scrolling on body when the login is open
        document.body.style.overflow = 'hidden';

        // Cleanup function to re-enable scrolling
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className=' absolute top-0 left-0 right-0 bottom-0 z-10 backdrop-blur-sm bg-black/30 flex justify-center items-center'>
            <motion.form onSubmit={onSubmitHandler} className='relative bg-white p-10 rounded-xl text-slate-500'
                initial={{ opacity: 0.2, y: 50 }}
                transition={{ duration: 0.3 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >

                <h1 className='text-center text-2xl text-neutral-700 font-medium'>{state}</h1>

                <p className='text-sm'>Welcome back! Please sign in to continue</p>

                {state !== 'Login' && <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-5'>
                    <img src={assets.email_icon} alt="" />
                    <input 
                        onChange={e => setName(e.target.value)} 
                        value={name} 
                        className='outline-none text-sm w-full' 
                        type="text" 
                        placeholder='Full Name' 
                        required 
                    />
                </div>}

                <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
                    <img src={assets.email_icon} alt="" />
                    <input 
                        onChange={e => setEmail(e.target.value)} 
                        value={email} 
                        className='outline-none text-sm w-full' 
                        type="email" 
                        placeholder='Email id' 
                        required 
                    />
                </div>

                <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
                    <img src={assets.lock_icon} alt="" />
                    <input 
                        onChange={e => setPassword(e.target.value)} 
                        value={password} 
                        className='outline-none text-sm w-full' 
                        type="password" 
                        placeholder='Password' 
                        required 
                        minLength={6}
                    />
                </div>

                <p className='text-sm text-blue-600 my-4 cursor-pointer'>Forgot password?</p>

                <button 
                    className='bg-blue-600 w-full text-white py-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors' 
                    disabled={loading}
                    type="submit"
                >
                    {loading ? 'Processing...' : state === 'Login' ? 'Login' : 'Create Account'}
                </button>

                {state === "Login"
                    ? <p className='mt-5 text-center'>Don't have an account? <span onClick={() => setState('Sign Up')} className='text-blue-600 cursor-pointer hover:underline'>Sign up</span></p>
                    : <p className='mt-5 text-center'>Already have an account? <span onClick={() => setState('Login')} className='text-blue-600 cursor-pointer hover:underline'>Login</span></p>
                }

                <img 
                    onClick={() => setShowLogin(false)} 
                    className='absolute top-5 right-5 cursor-pointer hover:opacity-80 transition-opacity' 
                    src={assets.cross_icon} 
                    alt="Close" 
                />
            </motion.form>
        </div>
    )
}

export default Login