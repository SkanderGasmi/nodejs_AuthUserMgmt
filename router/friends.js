/**
 * ============================================================================
 * Friends API Router Module
 * ============================================================================
 * 
 * This module defines all CRUD (Create, Read, Update, Delete) operations
 * for managing a friends list. All endpoints are protected by JWT authentication
 * middleware defined in the main index.js file.
 * 
 * The friends data is stored in an in-memory JavaScript object for simplicity.
 * In a production environment, this would be replaced with a database connection.
 * 
 * API Structure:
 * - GET    /friends           - Retrieve all friends
 * - GET    /friends/:email    - Retrieve a specific friend by email
 * - POST   /friends           - Add a new friend
 * - PUT    /friends/:email    - Update an existing friend
 * - DELETE /friends/:email    - Delete a friend
 * 
 * All endpoints return JSON responses with a consistent format:
 * {
 *   success: boolean,    // Indicates if the operation was successful
 *   message: string,     // Human-readable message about the operation
 *   data: any,          // The actual data returned (if applicable)
 *   count?: number      // Additional metadata (for GET all endpoint)
 * }
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

/**
 * ----------------------------------------------------------------------------
 * In-Memory Data Store
 * ----------------------------------------------------------------------------
 * 
 * This object serves as a temporary database for demonstration purposes.
 * Structure: { "email@example.com": { firstName, lastName, DOB } }
 * 
 * ⚠️ IMPORTANT NOTES:
 * 1. In-memory storage is volatile - data is lost when server restarts
 * 2. Not suitable for production - use a proper database (MongoDB, PostgreSQL, etc.)
 * 3. Email addresses are used as unique keys for friend identification
 * 4. Dates are stored as strings in "DD-MM-YYYY" format
 * ----------------------------------------------------------------------------
 */
let friends = {
  "johnsmith@gmail.com": {
    "firstName": "John",
    "lastName": "Doe",
    "DOB": "22-12-1990"
  },
  "annasmith@gmail.com": {
    "firstName": "Anna",
    "lastName": "Smith",
    "DOB": "02-07-1983"
  },
  "peterjones@gmail.com": {
    "firstName": "Peter",
    "lastName": "Jones",
    "DOB": "21-03-1989"
  }
};

/**
 * ============================================================================
 * GET /friends
 * ============================================================================
 * 
 * Retrieves all friends from the data store.
 * 
 * USE CASE: When you need to display the complete friends list.
 * 
 * @route GET /friends
 * @group Friends - CRUD operations for friends management
 * @returns {object} 200 - Success response with all friends
 * @returns {object} 401 - Unauthorized (handled by auth middleware)
 * @returns {object} 500 - Server error
 * 
 * @example
 * // Successful response
 * {
 *   "success": true,
 *   "data": {
 *     "johnsmith@gmail.com": { "firstName": "John", "lastName": "Doe", "DOB": "22-12-1990" },
 *     "annasmith@gmail.com": { "firstName": "Anna", "lastName": "Smith", "DOB": "02-07-1983" }
 *   },
 *   "count": 2
 * }
 */
router.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: friends,
      count: Object.keys(friends).length,
      message: `Successfully retrieved ${Object.keys(friends).length} friend(s)`
    });
  } catch (error) {
    console.error("Error retrieving friends:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving friends"
    });
  }
});

/**
 * ============================================================================
 * GET /friends/:email
 * ============================================================================
 * 
 * Retrieves a specific friend by their email address.
 * Email is used as the unique identifier in this system.
 * 
 * USE CASE: When you need details of a specific friend.
 * 
 * @route GET /friends/:email
 * @group Friends - CRUD operations for friends management
 * @param {string} email.path.required - The email address of the friend to retrieve
 * @returns {object} 200 - Success response with friend data
 * @returns {object} 404 - Friend not found
 * @returns {object} 401 - Unauthorized (handled by auth middleware)
 * @returns {object} 500 - Server error
 * 
 * @example
 * // Request: GET /friends/johnsmith@gmail.com
 * // Successful response
 * {
 *   "success": true,
 *   "data": {
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "DOB": "22-12-1990"
 *   }
 * }
 */
router.get("/:email", (req, res) => {
  try {
    const email = req.params.email;
    const friend = friends[email];

    if (friend) {
      res.status(200).json({
        success: true,
        data: friend,
        message: `Friend '${email}' retrieved successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Friend with email '${email}' not found`
      });
    }
  } catch (error) {
    console.error(`Error retrieving friend ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving friend"
    });
  }
});

/**
 * ============================================================================
 * POST /friends
 * ============================================================================
 * 
 * Creates a new friend entry in the data store.
 * Requires all fields: email, firstName, lastName, and DOB.
 * 
 * VALIDATION RULES:
 * 1. All fields must be provided (no empty values)
 * 2. Email must be unique (not already in the database)
 * 3. Email should be in valid format (basic check)
 * 
 * USE CASE: When adding a new friend to your list.
 * 
 * @route POST /friends
 * @group Friends - CRUD operations for friends management
 * @param {string} email.body.required - Friend's email address (unique identifier)
 * @param {string} firstName.body.required - Friend's first name
 * @param {string} lastName.body.required - Friend's last name
 * @param {string} DOB.body.required - Friend's date of birth (DD-MM-YYYY format)
 * @returns {object} 201 - Friend created successfully
 * @returns {object} 400 - Missing fields or duplicate email
 * @returns {object} 401 - Unauthorized (handled by auth middleware)
 * @returns {object} 500 - Server error
 * 
 * @example
 * // Request body
 * {
 *   "email": "newfriend@example.com",
 *   "firstName": "Alice",
 *   "lastName": "Johnson",
 *   "DOB": "15-03-1992"
 * }
 * 
 * // Successful response
 * {
 *   "success": true,
 *   "message": "Friend created successfully",
 *   "data": {
 *     "firstName": "Alice",
 *     "lastName": "Johnson",
 *     "DOB": "15-03-1992"
 *   }
 * }
 */
router.post("/", (req, res) => {
  try {
    const { email, firstName, lastName, DOB } = req.body;

    // Input validation
    if (!email || !firstName || !lastName || !DOB) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: email, firstName, lastName, DOB"
      });
    }

    // Basic email format validation
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Check for duplicate email
    if (friends[email]) {
      return res.status(400).json({
        success: false,
        message: `Friend with email '${email}' already exists`
      });
    }

    // Create new friend entry
    friends[email] = { firstName, lastName, DOB };

    // Return 201 Created status for successful resource creation
    res.status(201).json({
      success: true,
      message: "Friend created successfully",
      data: friends[email]
    });
  } catch (error) {
    console.error("Error creating friend:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating friend"
    });
  }
});

/**
 * ============================================================================
 * PUT /friends/:email
 * ============================================================================
 * 
 * Updates an existing friend's information.
 * Supports partial updates - only provided fields will be modified.
 * 
 * FEATURES:
 * 1. Partial updates allowed (update only the fields you want to change)
 * 2. Tracks which fields were actually modified in the response
 * 3. Validates that the friend exists before attempting updates
 * 
 * USE CASE: When you need to update a friend's information.
 * 
 * @route PUT /friends/:email
 * @group Friends - CRUD operations for friends management
 * @param {string} email.path.required - Email of the friend to update
 * @param {string} firstName.body.optional - New first name
 * @param {string} lastName.body.optional - New last name
 * @param {string} DOB.body.optional - New date of birth (DD-MM-YYYY format)
 * @returns {object} 200 - Friend updated successfully
 * @returns {object} 404 - Friend not found
 * @returns {object} 401 - Unauthorized (handled by auth middleware)
 * @returns {object} 500 - Server error
 * 
 * @example
 * // Request: PUT /friends/johnsmith@gmail.com
 * // Request body (partial update - only lastName)
 * {
 *   "lastName": "Smith"
 * }
 * 
 * // Successful response
 * {
 *   "success": true,
 *   "message": "Friend updated. Fields modified: lastName",
 *   "data": {
 *     "firstName": "John",
 *     "lastName": "Smith",
 *     "DOB": "22-12-1990"
 *   }
 * }
 */
router.put("/:email", (req, res) => {
  try {
    const email = req.params.email;
    const updates = req.body;

    // Check if friend exists
    if (!friends[email]) {
      return res.status(404).json({
        success: false,
        message: `Friend with email '${email}' not found`
      });
    }

    // Track modified fields for response message
    const updatedFields = [];

    // Apply updates only for provided fields
    if (updates.firstName !== undefined && updates.firstName !== friends[email].firstName) {
      friends[email].firstName = updates.firstName;
      updatedFields.push('firstName');
    }

    if (updates.lastName !== undefined && updates.lastName !== friends[email].lastName) {
      friends[email].lastName = updates.lastName;
      updatedFields.push('lastName');
    }

    if (updates.DOB !== undefined && updates.DOB !== friends[email].DOB) {
      friends[email].DOB = updates.DOB;
      updatedFields.push('DOB');
    }

    // Construct appropriate response message
    let message;
    if (updatedFields.length === 0) {
      message = "No fields were updated (values unchanged)";
    } else if (updatedFields.length === 1) {
      message = `Updated ${updatedFields[0]} for friend '${email}'`;
    } else {
      message = `Friend updated. Fields modified: ${updatedFields.join(', ')}`;
    }

    res.status(200).json({
      success: true,
      message: message,
      data: friends[email],
      updatedFields: updatedFields.length > 0 ? updatedFields : undefined
    });
  } catch (error) {
    console.error(`Error updating friend ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating friend"
    });
  }
});

/**
 * ============================================================================
 * DELETE /friends/:email
 * ============================================================================
 * 
 * Removes a friend from the data store.
 * Returns the deleted friend's data in the response for confirmation.
 * 
 * SECURITY NOTE: In a production system, consider implementing:
 * 1. Soft delete (mark as deleted instead of permanent removal)
 * 2. Archive functionality
 * 3. Audit logging of all deletions
 * 
 * USE CASE: When you need to remove a friend from your list.
 * 
 * @route DELETE /friends/:email
 * @group Friends - CRUD operations for friends management
 * @param {string} email.path.required - Email of the friend to delete
 * @returns {object} 200 - Friend deleted successfully
 * @returns {object} 404 - Friend not found
 * @returns {object} 401 - Unauthorized (handled by auth middleware)
 * @returns {object} 500 - Server error
 * 
 * @example
 * // Request: DELETE /friends/johnsmith@gmail.com
 * // Successful response
 * {
 *   "success": true,
 *   "message": "Friend with email 'johnsmith@gmail.com' deleted successfully",
 *   "data": {
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "DOB": "22-12-1990"
 *   }
 * }
 */
router.delete("/:email", (req, res) => {
  try {
    const email = req.params.email;

    // Check if friend exists
    if (!friends[email]) {
      return res.status(404).json({
        success: false,
        message: `Friend with email '${email}' not found`
      });
    }

    // Preserve friend data for response before deletion
    const deletedFriend = { ...friends[email] };

    // Delete the friend from the data store
    delete friends[email];

    res.status(200).json({
      success: true,
      message: `Friend with email '${email}' deleted successfully`,
      data: deletedFriend,
      remainingCount: Object.keys(friends).length
    });
  } catch (error) {
    console.error(`Error deleting friend ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting friend"
    });
  }
});

/**
 * ============================================================================
 * Module Export
 * ============================================================================
 * 
 * Exports the router to be mounted in the main Express application.
 * The main index.js file will import this router and attach it to the
 * '/friends' route path.
 */
module.exports = router;