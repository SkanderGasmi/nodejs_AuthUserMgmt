```md
# Friends List API with JWT Authentication

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-orange.svg)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete RESTful API for managing a friends list with secure JWT-based authentication. Built with Node.js, Express, and modern authentication practices.

## Features

- Secure authentication using JWT
- Protected routes via middleware
- Full CRUD operations for friends
- Session management with express-session
- Health check endpoint
- In-memory data storage (replaceable with a database)
- Clear and structured API documentation

## Project Structure

```

nodejs_PracticeProject_AuthUserMgmt/
├── index.js
├── router/
│   └── friends.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore

````

## Prerequisites

- Node.js v18 or higher
- npm
- PowerShell or curl for testing

## Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd nodejs_PracticeProject_AuthUserMgmt
````

2. Install dependencies

   ```bash
   npm install
   ```

3. Start the server

   ```bash
   npm start
   ```

The server runs on `http://localhost:5000`.

## API Endpoints

### Public Endpoints

| Method | Endpoint  | Description                |
| -----: | --------- | -------------------------- |
|   POST | /register | Register a new user        |
|   POST | /login    | Login and receive JWT      |
|   POST | /logout   | Logout and destroy session |
|    GET | /health   | Health check               |

### Protected Endpoints (JWT Required)

| Method | Endpoint        | Description               |
| -----: | --------------- | ------------------------- |
|    GET | /friends        | Get all friends           |
|    GET | /friends/:email | Get friend by email       |
|   POST | /friends        | Add a new friend          |
|    PUT | /friends/:email | Update friend information |
| DELETE | /friends/:email | Delete a friend           |

## Authentication Flow

1. Register a user
2. Login to receive a JWT stored in session
3. Access protected routes
4. Logout to invalidate session

## API Testing

### PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/register" -Method Post `
-Headers @{"Content-Type"="application/json"} `
-Body '{"username":"testuser","password":"testpass"}'
```

### curl

```bash
curl -X POST http://localhost:5000/register \
-H "Content-Type: application/json" \
-d '{"username":"testuser","password":"testpass"}'
```

## Example Responses

### Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "username": "testuser",
    "tokenExpiresIn": "1 hour"
  }
}
```

### Get Friends Response

```json
{
  "success": true,
  "data": {
    "johnsmith@gmail.com": {
      "firstName": "John",
      "lastName": "Doe",
      "DOB": "22-12-1990"
    }
  },
  "count": 1
}
```

## Configuration

### JWT

* Secret: `access`
* Expiration: 1 hour

### Session

```js
app.use(session({
  secret: "friends-api-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 3600000
  }
}));
```

## Data Storage

* Users stored in memory
* Friends stored as an object keyed by email
* Replaceable with MongoDB, PostgreSQL, etc.

## Security Notes

* Hash passwords with bcrypt
* Use environment variables
* Enable HTTPS in production
* Add rate limiting and validation
* Configure CORS properly

## Initial Friends Data

| Email                                               | First Name | Last Name | DOB        |
| --------------------------------------------------- | ---------- | --------- | ---------- |
| [johnsmith@gmail.com](mailto:johnsmith@gmail.com)   | John       | Doe       | 22-12-1990 |
| [annasmith@gmail.com](mailto:annasmith@gmail.com)   | Anna       | Smith     | 02-07-1983 |
| [peterjones@gmail.com](mailto:peterjones@gmail.com) | Peter      | Jones     | 21-03-1989 |

## Error Format

```json
{
  "success": false,
  "message": "Error description"
}
```

## Dependencies

```json
{
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0",
  "express-session": "^1.17.0"
}
```

## License

MIT License. See LICENSE file for details.

```
```
