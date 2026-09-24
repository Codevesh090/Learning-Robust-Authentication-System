# 🛡️ Robust Authentication & Session Management System

A production-ready Node.js, Express, and TypeScript authentication backend built with security best practices, including Argon2 password hashing, OTP verification via email, HTTP-Only secure cookies, Refresh Token rotation, and session revoking.

---

## 📋 Table of Contents
- [1. User Sign-Up & Login Flow](#1-user-sign-up--login-flow)
- [2. Email OTP Verification Flow](#2-email-otp-verification-flow)
- [3. Token Expiration & Token Rotation Flow](#3-token-expiration--token-rotation-flow)
- [4. Single Device Logout Flow](#4-single-device-logout-flow)
- [5. Logout All Devices Flow](#5-logout-all-devices-flow)
- [6. API Route & Controller Hierarchy Tree](#6-api-route--controller-hierarchy-tree)
- [7. Project Directory Structure Tree](#7-project-directory-structure-tree)
- [8. End-to-End System Lifecycle](#8-end-to-end-system-lifecycle)

---

## 1. User Sign-Up & Login Flow

This flow handles user registration, password hashing with Argon2, user lookup, credential validation, and dual-token session initialization upon successful authentication.

```text
                        👤 USER
                           │
       ┌───────────────────┴───────────────────┐
       │                                       │
       ▼                                       ▼
  📝 SIGN UP                               🔑 LOGIN
       │                                       │
       ▼                                       ▼
POST /api/auth/register                 POST /api/auth/login
       │                                       │
       ▼                                       ▼
 userRegisterController()              userLoginController()
       │                                       │
       ▼                                       ▼
 Check username/email                 Find user by email
       │                                       │
       ▼                                       ▼
Validate password                      User exists?
       │                                       │
       ▼                            ┌──────────┴──────────┐
  Hash password                     │                     │
       │                           NO                    YES
       ▼                            │                     │
  Create User                       ▼                     ▼
       │                           401              Check verified
       │                                                  │
       ▼                                           ┌──────┴──────┐
  sendOtp(userId)                                  │             │
       │                                          NO            YES
       ▼                                           │             │
┌──────────────┐                                   ▼             ▼
│  sendOtp()   │                                  403      Verify password
└──────┬───────┘                                                 │
       │                                                  ┌──────┴──────┐
       ▼                                                  │             │
Find user from DB                                       WRONG         CORRECT
       │                                                  │             │
       ▼                                                  ▼             ▼
Generate 6-digit OTP                                     401      Generate Refresh
       │                                                              Token
       ▼                                                                │
Hash OTP using crypto                                                   ▼
       │                                                       Hash Refresh Token
       ▼                                                                │
Delete old OTP for user                                                 ▼
       │                                                       Create Session
       ▼                                                        ├── userId
  Create new OTP                                                ├── refreshTokenHash
       │                                                        ├── ip
       ▼                                                        ├── userAgent
┌─────────────────────┐                                         └── revoked: false
│ otpModel            │                                                 │
│   userId            │                                                 ▼
│   otpHash           │                                       Put Refresh Token
│   expiresAt         │                                       in HttpOnly Cookie
│   attempts: 0       │                                                 │
└──────────┬──────────┘                                                 ▼
           │                                                  Generate Access Token
           ▼                                                            │
      Send Email                                                        ▼
           │                                                   Send Access Token
           ▼                                                         to client
    Signup response                                                     │
           │                                                            ▼
           ▼                                                       🟢 LOGGED IN
  Frontend gets userId
           │
           ▼
  Navigate to OTP page
```

---

## 2. Email OTP Verification Flow

Validates 6-digit email verification OTPs, enforces maximum retry limits (5 attempts), checks expiration, and updates user verification status.

```text
                 👤 USER / FRONTEND
                         │
                         ▼
             POST /api/auth/verifyOtp
                         │
                         ▼
                verifyOtpController()
                         │
                         ▼
               Find OTP by userId
                         │
              ┌──────────┴──────────┐
              │                     │
          NOT FOUND               FOUND
              │                     │
              ▼                     ▼
           400 Error         Check attempts
                                    │
                             ┌──────┴──────┐
                             │             │
                          >= 5            < 5
                             │             │
                             ▼             ▼
                        Delete OTP    Check expiresAt
                        429 Status         │
                                     ┌─────┴─────┐
                                     │           │
                                  EXPIRED      VALID
                                     │           │
                                     ▼           ▼
                                Delete OTP   Hash submitted OTP
                                400 Status       │
                                                 ▼
                                           Compare hashes
                                                 │
                                          ┌──────┴──────┐
                                          │             │
                                       WRONG         CORRECT
                                          │             │
                                          ▼             ▼
                                     attempts++   verified = true
                                          │             │
                                          ▼             ▼
                                     400 Error     Delete OTP
                                                        │
                                                        ▼
                                                 Email Verified ✅
                                                        │
                                                        ▼
                                                  User can LOGIN
```

---

## 3. Token Expiration & Token Rotation Flow

When short-lived Access Tokens expire (~10 min), the client automatically sends a request to `/refresh-token` with the HTTP-Only cookie. The backend verifies session validity, rotates the Refresh Token in the database, and issues new tokens.

```text
                          🟢 LOGGED IN USER
                                  │
                                  ▼
                     Access Token Expires (~10 min)
                                  │
               ┌──────────────────┴──────────────────┐
               │                                     │
               ▼                                     ▼
        Token Still Valid                      Token Expired
               │                                     │
               ▼                                     ▼
     Access Protected API               Client calls /refresh-token
               │                                     │
               ▼                                     ▼
            SUCCESS                     GET /api/auth/refresh-token
                                                     │
                                                     ▼
                                         refreshTokenController()
                                                     │
                                                     ▼
                                         Read refreshToken Cookie
                                                     │
                                                     ▼
                                               jwt.verify()
                                                     │
                                          ┌──────────┴──────────┐
                                          │                     │
                                       INVALID                VALID
                                          │                     │
                                          ▼                     ▼
                                     401 Error         Hash Refresh Token
                                                                │
                                                                ▼
                                                       Find Session in DB
                                                       (revoked: false)
                                                                │
                                                   ┌────────────┴────────────┐
                                                   │                         │
                                               NOT FOUND                   FOUND
                                                   │                         │
                                                   ▼                         ▼
                                              401 Error              Generate NEW
                                                                     Refresh Token
                                                                             │
                                                                             ▼
                                                                  Hash NEW Refresh Token
                                                                             │
                                                                             ▼
                                                                   Update session hash
                                                                             │
                                                                             ▼
                                                                   Set NEW Cookie
                                                                             │
                                                                             ▼
                                                                   Generate NEW Access Token
                                                                             │
                                                                             ▼
                                                                   Send Access Token
                                                                       to Client
```

---

## 4. Single Device Logout Flow

Revokes the user's active session for the current device in the database and clears the HTTP-Only refresh token cookie.

```text
                             CLIENT
                               │
                               ▼
                     GET /api/auth/log-out
                               │
                               ▼
                       logoutController()
                               │
                               ▼
                   Read refreshToken Cookie
                               │
                               ▼
                       Hash refreshToken
                               │
                               ▼
                   Find Active Session in DB
                               │
                               ▼
                         revoked = true
                               │
                               ▼
                          Save Session
                               │
                               ▼
                   clearCookie("refreshToken")
                               │
                               ▼
                          🔴 Logged Out
```

---

## 5. Logout All Devices Flow

Invalidates all active sessions across all devices for the logged-in user simultaneously by setting `revoked = true` across the database.

```text
                             CLIENT
                               │
                               ▼
                    GET /api/auth/logout-all
                               │
                               ▼
                     logoutAllController()
                               │
                               ▼
                   Read refreshToken Cookie
                               │
                               ▼
                         jwt.verify()
                               │
                               ▼
                           Get userId
                               │
                               ▼
                      updateMany({
                        user: userId,
                        revoked: false
                      }, {
                        $set: { revoked: true }
                      })
                               │
                               ▼
                   Set ALL User Sessions:
                       revoked = true
                               │
                               ▼
                   clearCookie("refreshToken")
                               │
                               ▼
                🔴 All Devices Logged Out
```

---

## 6. API Route & Controller Hierarchy Tree

Overview of all endpoints exposed under `/api/auth` and their underlying controller & middleware execution graph.

```text
/api/auth
│
├── POST /register
│    └── userRegisterController
│         └── sendOtp()
│
├── POST /login
│    └── userLoginController
│         ├── Generates Access Token
│         ├── Sets Refresh Token (HttpOnly Cookie)
│         └── Creates Active DB Session
│
├── GET  /get-me
│    └── authmiddleware
│         └── getMeController
│
├── GET  /refresh-token
│    └── refreshTokenController
│         ├── Verifies Refresh Token
│         ├── Finds DB Session
│         ├── Rotates Refresh Token
│         └── Issues New Access Token
│
├── GET  /log-out
│    └── logoutController
│         ├── Revokes Current Session
│         └── Clears Cookie
│
├── GET  /logout-all
│    └── logoutAllController
│         ├── Revokes ALL User Sessions
│         └── Clears Cookie
│
├── POST /sendVerificationOtp
│    └── sendVerificationOtpController
│         └── sendOtp(userId)
│              ├── Generates OTP
│              ├── Hashes OTP
│              ├── Saves to DB (5 min expiry)
│              └── Sends Email via Nodemailer
│
└── POST /verifyOtp
     └── verifyOtpController
          ├── Validates Attempts (< 5)
          ├── Validates Expiration
          ├── Hashes & Compares OTP
          ├── Sets verified = true
          └── Deletes OTP Document
```

---

## 7. Project Directory Structure Tree

```text
learning-robust-auth-system/
├── dist/                          # Compiled JavaScript build output
├── node_modules/                  # Project dependencies
├── src/                           # TypeScript source code
│   ├── config/                    # Configuration settings
│   │   ├── db.config.ts           # Mongoose MongoDB connection setup
│   │   └── env.config.ts          # Environment variables validation & export
│   ├── constants/                 # Constant definitions
│   │   └── statusCodes.constant.ts# HTTP Status Code Enum
│   ├── controllers/               # Request handlers
│   │   └── auth.controller.ts     # Register, Login, Refresh, Logout, OTP handlers
│   ├── middlewares/               # Custom Express middlewares
│   │   └── auth.middleware.ts     # JWT Access Token authentication middleware
│   ├── models/                    # Mongoose Data Schemas
│   │   ├── otp.model.ts           # OTP schema with expiration and attempts
│   │   ├── session.model.ts       # Active sessions schema with hashed tokens
│   │   └── user.model.ts          # User account schema
│   ├── routes/                    # Express Router definitions
│   │   └── auth.router.ts         # Authentication routes mapping
│   ├── services/                  # External service integrations
│   │   ├── email.service.ts       # Nodemailer OAuth2 transport service
│   │   └── sendOtp.service.ts     # OTP generation, hashing & dispatch logic
│   ├── types/                     # TypeScript type definitions
│   │   └── express.d.ts           # Extended Express Request declaration
│   ├── utils/                     # Utility helper functions
│   │   ├── generateOtp.utils.ts   # 6-digit random OTP generator
│   │   ├── hashOtp.utils.ts       # Crypto SHA256 OTP hashing
│   │   ├── password.utils.ts      # Argon2 password hashing & verification
│   │   └── refreshTokenHash.utils.ts # Crypto refresh token hashing
│   ├── app.ts                     # Express app setup & middleware configuration
│   └── server.ts                  # Server entrypoint & HTTP listener
├── .env                           # Environment variables configuration
├── .gitignore                     # Git ignored files configuration
├── package.json                   # Project metadata, dependencies & scripts
├── Readme.md                      # Documentation & System Flow Charts
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 8. End-to-End System Lifecycle

```text
SIGNUP ➔ USER CREATED ➔ sendOtp() ➔ OTP EMAIL ➔ VERIFY OTP ➔ VERIFIED ➔ LOGIN ➔ DUAL TOKENS + SESSION ➔ TOKEN EXPIRY ➔ ROTATE REFRESH TOKEN ➔ NEW ACCESS TOKEN ➔ LOGOUT (REVOKE SESSION)
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_oauth_refresh_token
GOOGLE_USER=your_email@gmail.com
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build & Run Production Server
```bash
npm run build
npm start
```
