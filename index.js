/**
 * ============================================================================
 * Friends List API Server with JWT Authentication
 * ============================================================================
 * 
 * Main Express server application that provides a complete REST API for
 * managing a friends list with secure JWT-based authentication.
 * 
 * ARCHITECTURE OVERVIEW:
 * 1. User Authentication Layer
 *    - Registration (/register)
 *    - Login with JWT generation (/login)
 *    - Logout with session destruction (/logout)
 *    - Session management with express-session
 * 
 * 2. Protected API Layer (requires authentication)
 *    - All /friends endpoints are protected by JWT middleware
 *    - CRUD operations for managing friends
 * 
 * 3. Utility Endpoints
 *    - Health check (/health)
 *    - Server status monitoring
 * 
 * SECURITY FEATURES:
 * - JWT (JSON Web Tokens) for stateless authentication
 * - Session management with secure cookies
 * - Protected routes middleware
 * - Input validation and sanitization
 * - Password hashing (to be implemented in production)
 * 
 * TECHNOLOGIES:
 * - Express.js - Web application framework
 * - JWT - Token-based authentication
 * - express-session - Session management
 * - In-memory storage (for demonstration only)
 * 
 * PRODUCTION CONSIDERATIONS:
 * 1. Replace in-memory storage with a database (MongoDB, PostgreSQL)
 * 2. Use environment variables for configuration
 * 3. Implement password hashing (bcrypt)
 * 4. Add rate limiting
 * 5. Enable CORS for cross-origin requests
 * 6. Use HTTPS in production
 * 7. Add request logging and monitoring
 * ============================================================================
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const routes = require('./router/friends.js'); // Import the friends router

/**
 * ----------------------------------------------------------------------------
 * In-Memory User Storage
 * ----------------------------------------------------------------------------
 * 
 * ⚠️ WARNING: This is for demonstration purposes only.
 * In a production environment, this should be replaced with a proper database.
 * 
 * Structure: Array of user objects
 * [
 *   {
 *     username: string,      // Unique identifier for the user
 *     password: string,      // Plain text password (⚠️ should be hashed in production)
 *     createdAt: string      // ISO timestamp of user creation
 *   }
 * ]
 * ----------------------------------------------------------------------------
 */
const users = [];

/**
 * ----------------------------------------------------------------------------
 * Utility Functions
 * ----------------------------------------------------------------------------
 */

/**
 * Check if a username already exists in the users array
 * 
 * @param {string} username - The username to check for existence
 * @returns {boolean} - True if username exists, false otherwise
 * 
 * @example
 * doesExist('john_doe'); // Returns: true or false
 */
const doesExist = (username) => {
    return users.some(user => user.username === username);
};

/**
 * Authenticate user credentials against the stored users
 * 
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to verify
 * @returns {boolean} - True if credentials are valid, false otherwise
 * 
 * @example
 * authenticatedUser('john_doe', 'secret123'); // Returns: true or false
 * 
 * ⚠️ SECURITY NOTE: In production, passwords should be hashed and compared
 * using a secure hashing algorithm like bcrypt.
 */
const authenticatedUser = (username, password) => {
    return users.some(user =>
        user.username === username && user.password === password
    );
};

/**
 * ----------------------------------------------------------------------------
 * Express Application Initialization
 * ----------------------------------------------------------------------------
 */
const app = express();

/**
 * ----------------------------------------------------------------------------
 * Middleware Configuration
 * ----------------------------------------------------------------------------
 */

/**
 * Session Management Middleware
 * 
 * Configures express-session for managing user sessions.
 * In production, use a session store (Redis, MongoDB) instead of in-memory.
 * 
 * @see https://www.npmjs.com/package/express-session
 */
app.use(session({
    secret: "friends-api-secret-key", // Should be a strong, environment variable in production
    resave: false,                    // Don't save session if unmodified
    saveUninitialized: false,         // Don't create session until something is stored
    cookie: {
        secure: false,                // Set to true in production with HTTPS
        httpOnly: true,               // Prevent client-side JavaScript access
        sameSite: 'strict',           // Protection against CSRF attacks
        maxAge: 60 * 60 * 1000        // Session expires after 1 hour
    }
}));

/**
 * JSON Body Parser Middleware
 * 
 * Parses incoming JSON requests and makes the data available in req.body
 */
app.use(express.json());

/**
 * ----------------------------------------------------------------------------
 * Authentication Middleware for Protected Routes
 * ----------------------------------------------------------------------------
 * 
 * This middleware protects all routes under the /friends path.
 * It verifies the JWT token stored in the session before allowing access
 * to the protected resources.
 * 
 * WORKFLOW:
 * 1. Check if user has an active session with authorization data
 * 2. Extract JWT token from session
 * 3. Verify the token using the secret key
 * 4. If valid, attach user data to request object and proceed
 * 5. If invalid, return appropriate error response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
app.use("/friends", function authMiddleware(req, res, next) {
    // Check if user has an active session
    if (!req.session.authorization) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login first."
        });
    }

    const token = req.session.authorization.accessToken;
    const username = req.session.authorization.username;

    // Verify the JWT token
    jwt.verify(token, "access", (err, decoded) => {
        if (err) {
            // Token is invalid or expired
            return res.status(403).json({
                success: false,
                message: "Session expired or invalid. Please login again."
            });
        }

        // Attach user information to the request object for downstream handlers
        req.user = {
            username: username,
            data: decoded.data
        };

        // Proceed to the protected route handler
        next();
    });
});

/**
 * ============================================================================
 * Public Routes (No Authentication Required)
 * ============================================================================
 */

/**
 * POST /register
 * ----------------------------------------------------------------------------
 * Registers a new user account.
 * 
 * VALIDATION:
 * - Username and password must be provided
 * - Username must be unique (not already registered)
 * 
 * SECURITY NOTES:
 * - In production, passwords should be hashed before storage
 * - Consider adding password strength requirements
 * - Implement email verification for production systems
 * 
 * @route POST /register
 * @group Authentication - User registration and authentication
 * @param {string} username.body.required - Desired username
 * @param {string} password.body.required - Desired password
 * @returns {object} 201 - User registered successfully
 * @returns {object} 400 - Missing username or password
 * @returns {object} 409 - Username already exists
 * 
 * @example
 * // Request
 * POST /register
 * {
 *   "username": "john_doe",
 *   "password": "securePassword123"
 * }
 * 
 * // Response (201 Created)
 * {
 *   "success": true,
 *   "message": "User registered successfully. You can now login."
 * }
 */
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required."
        });
    }

    // Check if username is already taken
    if (doesExist(username)) {
        return res.status(409).json({
            success: false,
            message: "Username already exists. Please choose a different username."
        });
    }

    // Store new user (in production, hash the password first)
    users.push({
        username: username,
        password: password, // ⚠️ In production, use: bcrypt.hashSync(password, 10)
        createdAt: new Date().toISOString()
    });

    // Return success response
    res.status(201).json({
        success: true,
        message: "User registered successfully. You can now login."
    });
});

/**
 * POST /login
 * ----------------------------------------------------------------------------
 * Authenticates a user and creates a JWT session.
 * 
 * WORKFLOW:
 * 1. Validate input (username and password)
 * 2. Authenticate credentials against stored users
 * 3. Generate JWT token with expiration
 * 4. Store token in session
 * 5. Return success response with token information
 * 
 * @route POST /login
 * @group Authentication - User registration and authentication
 * @param {string} username.body.required - Registered username
 * @param {string} password.body.required - User's password
 * @returns {object} 200 - Login successful with session information
 * @returns {object} 400 - Missing username or password
 * @returns {object} 401 - Invalid username or password
 * 
 * @example
 * // Request
 * POST /login
 * {
 *   "username": "john_doe",
 *   "password": "securePassword123"
 * }
 * 
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "username": "john_doe",
 *     "tokenExpiresIn": "1 hour"
 *   }
 * }
 */
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required."
        });
    }

    // Authenticate user credentials
    if (!authenticatedUser(username, password)) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password."
        });
    }

    // Generate JWT access token (valid for 1 hour)
    const accessToken = jwt.sign(
        {
            username: username,
            data: password // In production, use user ID or other non-sensitive data
        },
        'access', // Secret key - should be an environment variable in production
        { expiresIn: 60 * 60 } // 1 hour expiration
    );

    // Store token and user info in session
    req.session.authorization = {
        accessToken: accessToken,
        username: username
    };

    // Set session expiration to match token expiration
    req.session.cookie.maxAge = 60 * 60 * 1000;

    // Return success response
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            username: username,
            tokenExpiresIn: "1 hour"
        }
    });
});

/**
 * POST /logout
 * ----------------------------------------------------------------------------
 * Logs out the current user by destroying their session.
 * 
 * SECURITY NOTES:
 * - Session destruction prevents token reuse
 * - Client should also clear any stored tokens
 * 
 * @route POST /logout
 * @group Authentication - User registration and authentication
 * @returns {object} 200 - Logout successful
 * @returns {object} 500 - Server error during logout
 * 
 * @example
 * // Request
 * POST /logout
 * 
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 */
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error logging out. Please try again."
            });
        }

        res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    });
});

/**
 * GET /health
 * ----------------------------------------------------------------------------
 * Health check endpoint for monitoring and status verification.
 * 
 * USE CASES:
 * - Load balancer health checks
 * - Monitoring system uptime
 * - API status verification
 * 
 * @route GET /health
 * @group System - Server monitoring and status
 * @returns {object} 200 - Server is healthy and running
 * 
 * @example
 * // Request
 * GET /health
 * 
 * // Response (200 OK)
 * {
 *   "success": true,
 *   "message": "Friends API Server is running",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "version": "1.0.0"
 * }
 */
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Friends API Server is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

/**
 * ============================================================================
 * Mount Protected Routes
 * ============================================================================
 * 
 * All routes defined in ./router/friends.js are mounted under the /friends path.
 * These routes are protected by the authentication middleware above.
 */
app.use("/friends", routes);

/**
 * ============================================================================
 * Server Configuration and Startup
 * ============================================================================
 */

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

/**
 * Start the Express server
 * 
 * @listens {number} PORT - The port on which the server will listen
 */
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📝 API Documentation:`);
    console.log(`   POST /register    - Register new user`);
    console.log(`   POST /login       - Login and get JWT token`);
    console.log(`   POST /logout      - Logout and destroy session`);
    console.log(`   GET  /health      - Server health check`);
    console.log(`   GET  /friends     - Get all friends (protected)`);
    console.log(`   GET  /friends/:email - Get specific friend (protected)`);
    console.log(`   POST /friends     - Add new friend (protected)`);
    console.log(`   PUT  /friends/:email - Update friend (protected)`);
    console.log(`   DELETE /friends/:email - Delete friend (protected)`);
    console.log(``);
    console.log(`🔒 Security Notes:`);
    console.log(`   - All /friends endpoints require authentication`);
    console.log(`   - JWT tokens expire after 1 hour`);
    console.log(`   - Sessions are managed server-side`);
    console.log(`   - In production: Use HTTPS, hash passwords, use database`);
});

/**
 * ----------------------------------------------------------------------------
 * Module Export
 * ----------------------------------------------------------------------------
 * 
 * Export the Express app for:
 * 1. Unit testing and integration testing
 * 2. Serverless deployment (AWS Lambda, etc.)
 * 3. Import in other modules if needed
 */
module.exports = app;