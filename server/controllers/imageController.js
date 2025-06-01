import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import userModel from '../models/userModel.js'
import imageModel from '../models/imageModel.js'

// Test function to verify Clipdrop API connection
export const testClipdropAPI = async (req, res) => {
    try {
        console.log('Testing Clipdrop API connection...');
        if (!process.env.CLIPDROP_API) {
            console.error('CLIPDROP_API key is missing');
            return res.status(500).json({ 
                success: false, 
                message: 'CLIPDROP_API key is not configured in environment variables'
            });
        }
        console.log('API Key present:', !!process.env.CLIPDROP_API);
        
        const formdata = new FormData();
        formdata.append('prompt', 'test image');
        
        const response = await axios({
            method: 'post',
            url: 'https://clipdrop-api.co/text-to-image/v1',
            data: formdata,
            headers: {
                'x-api-key': process.env.CLIPDROP_API,
                ...formdata.getHeaders()
            },
            responseType: 'arraybuffer'
        });
        
        console.log('Clipdrop API test successful:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            dataSize: response.data?.length
        });

        // Convert test image to base64 to verify the response format
        const base64Image = Buffer.from(response.data).toString('base64');
        
        return res.status(200).json({
            success: true,
            message: 'API connection successful',
            testImage: `data:image/jpeg;base64,${base64Image}`
        });

    } catch (error) {
        console.error('Clipdrop API test failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            data: error.response?.data ? Buffer.from(error.response.data).toString() : 'No data'
        });
        
        if (error.response?.status === 401) {
            return res.status(500).json({
                success: false,
                message: 'Invalid API key'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'API connection failed',
            error: error.message
        });
    }
};

// API to generate image
export const generateImage = async (req, res) => {
    try {
        const { prompt } = req.body;
        const userId = req.body.userId; // This comes from auth middleware

        console.log('Image generation request:', { prompt, userId });

        // Check if user ID is present
        if (!userId) {
            console.log('No userId provided in request');
            return res.status(401).json({ success: false, message: 'Please login to generate images' });
        }

        // Check if prompt is present
        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Please provide a prompt' });
        }

        // Check if CLIPDROP_API key is present
        if (!process.env.CLIPDROP_API) {
            console.error('CLIPDROP_API key is missing');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        // Get user data
        const user = await userModel.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(401).json({ success: false, message: 'User not found. Please login again' });
        }

        // Create form data for the API request
        const formData = new FormData();
        formData.append('prompt', prompt);

        console.log('Making request to Clipdrop API with prompt:', prompt);
        
        // Make request to Clipdrop API
        const response = await axios({
            method: 'post',
            url: 'https://clipdrop-api.co/text-to-image/v1',
            data: formData,
            headers: {
                'x-api-key': process.env.CLIPDROP_API,
                ...formData.getHeaders()
            },
            responseType: 'arraybuffer'
        });

        if (!response.data) {
            console.error('No data received from Clipdrop API');
            throw new Error('No image data received');
        }

        console.log('Received response from Clipdrop API:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            dataLength: response.data.length
        });

        // Convert buffer to base64
        const base64Image = Buffer.from(response.data).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        // Save image data to database
        const imageData = {
            userId,
            prompt,
            imageUrl,
            date: Date.now()
        };

        const newImage = await imageModel.create(imageData);
        console.log('Image saved to database:', newImage._id);

        // Return success response with image data
        res.status(200).json({
            success: true,
            image: {
                id: newImage._id,
                url: imageUrl,
                prompt: prompt,
                date: newImage.date
            }
        });

    } catch (error) {
        console.error('Image generation error:', error);
        
        // Handle specific API errors
        if (error.response?.status === 401) {
            return res.status(500).json({ 
                success: false, 
                message: 'Server configuration error: Invalid API key'
            });
        }

        if (error.response?.status === 429) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.'
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Error generating image. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};