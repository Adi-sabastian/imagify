import jwt from 'jsonwebtoken'; 

// User authentication middleware
const authUser = async (req, res, next) => {
    try {
        // Extract the token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : null;

        // Check if the token is missing
        if (!token) {
            console.log('No token provided in headers');
            return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
        }

        // Verify the token using the secret key
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', tokenDecode);

        // Check if the decoded token contains a user ID
        if (tokenDecode.id) {
            // Attach user ID to the request body
            req.body.userId = tokenDecode.id;
            console.log('Added userId to request:', tokenDecode.id);
            next();
        } else {
            console.log('No id found in token');
            return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
    }
};

// Export the middleware
export default authUser; 
