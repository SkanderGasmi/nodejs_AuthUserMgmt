/**
 * Friends API Router
 * 
 * This module handles all CRUD operations for managing friends.
 * All endpoints are protected by JWT authentication middleware.
 */

const express = require('express');
const router = express.Router();

/**
 * In-memory storage for friends data.
 * Structure: { email: { firstName, lastName, DOB } }
 * 
 * This is a temporary storage for demonstration purposes.
 * In a production environment, this would be replaced with a database.
 */
const friends = {
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
 * GET /friends
 * 
 * Retrieve all friends from the database.
 * 
 * @returns {Object} JSON object containing all friends
 * @status 200 Successfully retrieved all friends
 */
router.get("/", (req, res) => {
  // Return all friends with pretty-printed JSON formatting
  res.status(200).json({
    success: true,
    data: friends,
    count: Object.keys(friends).length
  });
});

/**
 * GET /friends/:email
 * 
 * Retrieve a specific friend by their email address.
 * 
 * @param {string} email - Friend's email address (from URL parameter)
 * @returns {Object} Friend object if found
 * @status 200 Successfully retrieved friend
 * @status 404 Friend not found
 */
router.get("/:email", (req, res) => {
  const email = req.params.email;
  const friend = friends[email];

  if (friend) {
    res.status(200).json({
      success: true,
      data: friend
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Friend with email '${email}' not found`
    });
  }
});

/**
 * POST /friends
 * 
 * Create a new friend entry.
 * 
 * @param {string} email - Friend's email address (required)
 * @param {string} firstName - Friend's first name (required)
 * @param {string} lastName - Friend's last name (required)
 * @param {string} DOB - Friend's date of birth (required, format: DD-MM-YYYY)
 * @returns {Object} Created friend object
 * @status 201 Successfully created new friend
 * @status 400 Missing required fields or duplicate email
 */
router.post("/", (req, res) => {
  const { email, firstName, lastName, DOB } = req.body;

  // Validate all required fields are provided
  if (!email || !firstName || !lastName || !DOB) {
    return res.status(400).json({
      success: false,
      message: "All fields are required: email, firstName, lastName, DOB"
    });
  }

  // Check if friend with this email already exists
  if (friends[email]) {
    return res.status(400).json({
      success: false,
      message: `Friend with email '${email}' already exists`
    });
  }

  // Create new friend entry
  friends[email] = {
    firstName,
    lastName,
    DOB
  };

  res.status(201).json({
    success: true,
    message: "Friend created successfully",
    data: friends[email]
  });
});

/**
 * PUT /friends/:email
 * 
 * Update an existing friend's information.
 * Supports partial updates - only provided fields will be updated.
 * 
 * @param {string} email - Friend's email address (from URL parameter)
 * @param {Object} body - Fields to update (firstName, lastName, or DOB)
 * @returns {Object} Updated friend object
 * @status 200 Successfully updated friend
 * @status 404 Friend not found
 */
router.put("/:email", (req, res) => {
  const email = req.params.email;
  const updates = req.body;

  // Check if friend exists
  if (!friends[email]) {
    return res.status(404).json({
      success: false,
      message: `Friend with email '${email}' not found`
    });
  }

  // Track which fields were updated for the response
  const updatedFields = [];

  // Update only the fields provided in the request
  if (updates.firstName !== undefined) {
    friends[email].firstName = updates.firstName;
    updatedFields.push('firstName');
  }

  if (updates.lastName !== undefined) {
    friends[email].lastName = updates.lastName;
    updatedFields.push('lastName');
  }

  if (updates.DOB !== undefined) {
    friends[email].DOB = updates.DOB;
    updatedFields.push('DOB');
  }

  res.status(200).json({
    success: true,
    message: updatedFields.length > 0
      ? `Friend updated. Fields modified: ${updatedFields.join(', ')}`
      : 'No fields were updated',
    data: friends[email]
  });
});

/**
 * DELETE /friends/:email
 * 
 * Remove a friend from the database.
 * 
 * @param {string} email - Friend's email address (from URL parameter)
 * @returns {Object} Success message
 * @status 200 Successfully deleted friend
 * @status 404 Friend not found
 */
router.delete("/:email", (req, res) => {
  const email = req.params.email;

  // Check if friend exists
  if (!friends[email]) {
    return res.status(404).json({
      success: false,
      message: `Friend with email '${email}' not found`
    });
  }

  // Store the deleted friend's data for response
  const deletedFriend = { ...friends[email] };

  // Delete the friend
  delete friends[email];

  res.status(200).json({
    success: true,
    message: `Friend with email '${email}' deleted successfully`,
    data: deletedFriend
  });
});

// Export the router for use in the main application
module.exports = router;