const Replicate = require('replicate');
const Image = require('../models/Image');
const User = require('../models/User');

// Initialize Replicate with API key
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

// Generate image
exports.generateImage = async (req, res) => {
  try {
    const { prompt, negativePrompt, width, height, numInferenceSteps, guidanceScale, scheduler } = req.body;
    const userId = req.user.id;

    console.log('Starting image generation with params:', {
      prompt,
      negativePrompt,
      width,
      height,
      numInferenceSteps,
      guidanceScale,
      scheduler,
      userId
    });

    // Validate required fields
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate dimensions
    if (width < 64 || width > 1024 || height < 64 || height > 1024) {
      return res.status(400).json({ error: 'Invalid dimensions. Width and height must be between 64 and 1024' });
    }

    // Validate steps
    if (numInferenceSteps < 1 || numInferenceSteps > 100) {
      return res.status(400).json({ error: 'Invalid number of steps. Must be between 1 and 100' });
    }

    // Validate guidance scale
    if (guidanceScale < 1 || guidanceScale > 20) {
      return res.status(400).json({ error: 'Invalid guidance scale. Must be between 1 and 20' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Starting Replicate API call...');
    
    // Call Replicate API
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: negativePrompt || "blurry, low quality, distorted, disfigured",
          width: parseInt(width) || 1024,
          height: parseInt(height) || 1024,
          num_inference_steps: parseInt(numInferenceSteps) || 50,
          guidance_scale: parseFloat(guidanceScale) || 7.5,
          scheduler: scheduler || "K_EULER",
          num_outputs: 1
        }
      }
    );

    console.log('Replicate API response:', output);

    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error('Invalid response from Replicate API');
    }

    // Save image to database
    const image = new Image({
      userId,
      prompt,
      negativePrompt,
      imageUrl: output[0],
      width,
      height,
      numInferenceSteps,
      guidanceScale,
      scheduler
    });

    await image.save();
    console.log('Image saved to database:', image._id);

    res.json({
      success: true,
      image: {
        id: image._id,
        url: output[0],
        prompt,
        negativePrompt,
        width,
        height,
        numInferenceSteps,
        guidanceScale,
        scheduler
      }
    });

  } catch (error) {
    console.error('Error in generateImage:', error);
    res.status(500).json({ 
      error: 'Error generating image',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get user's images
exports.getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const images = await Image.find({ userId }).sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    console.error('Error in getUserImages:', error);
    res.status(500).json({ error: 'Error fetching images' });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const image = await Image.findOne({ _id: id, userId });
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await image.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('Error in deleteImage:', error);
    res.status(500).json({ error: 'Error deleting image' });
  }
}; 