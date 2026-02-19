# Password Manager with Multi-Factor Authentication
## Project Review 1 - Documentation

**Project Type:** Final Year Project - VIT  
**Date:** February 2026  
**Technology Stack:** MERN (MongoDB, Express.js, React, Node.js) + Python (DeepFace)

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features Implemented](#features-implemented)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Security Features](#security-features)
8. [Frontend Components](#frontend-components)
9. [Deployment Configuration](#deployment-configuration)
10. [Email Notifications](#email-notifications)

---

## 🎯 Project Overview

A **Zero-Knowledge Password Manager** with advanced multi-factor authentication including:
- Face Recognition (DeepFace + Facenet512)
- Email OTP Verification
- TOTP Authenticator App (Google Authenticator/Authy compatible)
- End-to-end encryption with client-side password encryption

**Key Principle:** The server never sees unencrypted passwords. All encryption/decryption happens on the client-side.

---

## 🏗️ Architecture

### System Components

```
┌─────────────────┐
│   Client Apps   │
│  - React SPA    │
│  - Standalone   │
│    HTML pages   │
└────────┬────────┘
         │
         ├──────────────┬──────────────┐
         │              │              │
         ▼              ▼              ▼
┌────────────────┐ ┌────────────┐ ┌──────────────┐
│   Node.js API  │ │  DeepFace  │ │   MongoDB    │
│   (Express)    │ │   Backend  │ │    Atlas     │
│   Port: 7860   │ │ (Python)   │ │   Database   │
│                │ │ Port: 7860 │ │              │
└────────────────┘ └────────────┘ └──────────────┘
```

### Deployment Platforms
- **Frontend:** GitHub Pages (`eraiyamuthan-p.github.io`)
- **Node.js Backend:** Hugging Face Spaces (`epscord-password-manager-api`)
- **Python Backend:** Hugging Face Spaces (`epscord-password-manager-deepface`)
- **Database:** MongoDB Atlas (Cloud)
- **Email Service:** Brevo API (Transactional emails)

---

## ✨ Features Implemented

### 1. **User Authentication System**

#### A. Registration Flow
- Email validation and uniqueness check
- Client-side master password hashing
- Encrypted vault key generation
- Email OTP verification (6-digit code, 10-minute expiry)
- Welcome email after successful verification
- Account remains unverified until OTP confirmation

#### B. Login Flow
- Master password verification with bcrypt (12 rounds)
- Multiple authentication methods:
  - **Email OTP:** 6-digit code sent via email
  - **TOTP (2FA):** Time-based one-time password (Authenticator apps)
  - **Face Recognition:** DeepFace with Facenet512 model
- JWT token-based session management
- Login alert emails with device and location info
- Account lockout after failed attempts

#### C. Password Reset
- Forgot password functionality with email OTP
- Password reset flow with verification
- Secure token generation and expiry

---

### 2. **Face Recognition System** 🔐

#### Technology Used
- **Backend:** DeepFace library (Python/Flask)
- **Model:** Facenet512 (512-dimensional embeddings)
- **Detector:** OpenCV (optimized for low memory)
- **Distance Metric:** Euclidean distance (threshold: 10.0)

#### Implementation Details

**Enrollment Process:**
1. User captures face through webcam
2. Face detection and embedding extraction (512-dim vector)
3. Embedding encoded to Base64 and stored in MongoDB
4. User's `faceAuthEnabled` flag set to true

**Verification Process:**
1. Real-time face capture during login
2. Current face embedding generated
3. Euclidean distance calculated with stored embedding
4. Authentication successful if distance < threshold
5. JWT token issued on successful face match

**API Endpoints:**
- `POST /api/enroll` - Register face template
- `POST /api/verify` - Verify face match
- `POST /api/auth/face/enroll` - Enable face auth for user
- `POST /api/auth/face/verify` - Login with face
- `POST /api/auth/face/disable` - Disable face authentication

#### Error Handling
- Face not detected scenarios
- Multiple faces detection
- Poor lighting conditions
- Invalid image format handling

---

### 3. **Two-Factor Authentication (2FA/TOTP)**

#### Implementation
- **Library:** Speakeasy (RFC 6238 compliant)
- **QR Code Generation:** qrcode library
- **Time Window:** 30-second intervals
- **Code Length:** 6 digits

#### Features
- Setup wizard with QR code display
- Compatible with Google Authenticator, Authy, Microsoft Authenticator
- Backup codes (future enhancement)
- 2FA disable with password confirmation
- 2FA status visible in user settings

#### Flow
1. User enables 2FA from settings
2. Server generates secret and QR code
3. User scans QR with authenticator app
4. User verifies setup with first TOTP code
5. 2FA required for all future logins

---

### 4. **Email OTP System**

#### Features
- **Purpose Types:** signup, login, password reset
- **Code Generation:** 6-digit random numeric code
- **Expiry Time:** 10 minutes
- **Rate Limiting:** 60 seconds between requests
- **Attempt Limiting:** Account lockout after multiple failed attempts
- **Professional Email Templates:** HTML-formatted with branding

#### Email Templates
1. **OTP Verification Email**
   - Clean, modern design
   - Large, monospace OTP display
   - Expiry information
   - Security warning

2. **Welcome Email** (After verification)
   - Gradient header design
   - Feature highlights
   - Security tips

3. **Login Alert Email**
   - Device information
   - IP address and location
   - Timestamp (IST timezone)
   - Security warning for unauthorized access

#### Security Measures
- OTP stored as bcrypt hash (never plaintext)
- Automatic expiry after 10 minutes
- Rate limiting to prevent spam
- Attempt counting with lockout
- One-time use (invalidated after successful verification)

---

### 5. **Password Management (Zero-Knowledge)**

#### Core Concept
- **Zero-Knowledge Architecture:** Server never sees plaintext passwords
- All encryption/decryption happens client-side
- Only encrypted data transmitted to server

#### Client-Side Encryption
```javascript
// Master key derivation from master password
const masterKey = CryptoJS.PBKDF2(masterPassword, salt, {
  keySize: 256/32,
  iterations: 100000
});

// Password encryption before sending to server
const encrypted = CryptoJS.AES.encrypt(passwordData, masterKey).toString();
```

#### Password Entry Schema
- **Encrypted Fields:** username, password, notes
- **Metadata (Unencrypted):** website, category, favorite status
- **Security Metrics:** strength score, breach status
- **Timestamps:** createdAt, updatedAt, lastUsed

#### CRUD Operations
- **Create:** Add new password entry
- **Read:** Get all passwords or single password
- **Update:** Modify existing password
- **Delete:** Remove password entry
- **Favorite:** Toggle favorite status
- **Search:** Search by website name
- **Filter:** Filter by category

#### Categories
- Social Media
- Banking
- Email
- Work
- Shopping
- Other

---

### 6. **Password Security Analytics**

#### A. Breach Detection
- **API:** HaveIBeenPwned (k-Anonymity model)
- **Method:** SHA-1 hash prefix matching
- **Privacy:** Only first 5 characters of hash sent
- **Endpoint:** `POST /api/security/check-breach`

#### B. Password Strength Analyzer
Points-based scoring system (0-100):

**Scoring Criteria:**
- Length (8+ chars: 20pts, 12+: 30pts, 16+: 40pts)
- Lowercase letters: 10pts
- Uppercase letters: 10pts
- Numbers: 10pts
- Special characters: 15pts
- Character variety: 15pts

**Penalties:**
- Repeating characters: -10pts
- Common patterns (123, abc, qwerty): -20pts

**Strength Levels:**
- 0-59: Weak (red)
- 60-79: Medium (yellow)
- 80-100: Strong (green)

**Feedback System:**
- Specific suggestions for improvement
- Real-time analysis as user types

#### C. Password Generator
- Customizable length (8-32 characters)
- Configurable character sets:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters
- Cryptographically secure random generation
- Instant strength analysis

---

### 7. **Security Middleware & Protection**

#### A. Authentication Middleware
```javascript
// JWT verification
// User existence check
// Account lockout check
// Requests attach user object to req.user
```

#### B. Rate Limiting
- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Scope:** All `/api/*` endpoints
- **Response:** 429 Too Many Requests

#### C. Helmet.js Security Headers
- Content Security Policy
- XSS Protection
- Cross-Origin Resource Policy
- Frame Options (prevent clickjacking)

#### D. CORS Configuration
```javascript
Allowed Origins:
- http://localhost:3000
- http://localhost:8080
- https://eraiyamuthan-p.github.io
- https://epscord-password-manager-api.hf.space

Methods: GET, POST, PUT, DELETE, OPTIONS
Credentials: Enabled
```

#### E. Account Lockout
- Failed login attempt tracking
- Exponential lockout duration
- Status checking before authentication

---

## 🛠️ Technology Stack

### Backend

#### Node.js Server
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1",
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.3",
  "nodemailer": "^7.0.10",
  "axios": "^1.6.2",
  "dotenv": "^16.3.1"
}
```

#### Python Backend (DeepFace)
```txt
flask==2.3.3
flask-cors==4.0.0
deepface==0.0.90
opencv-python-headless==4.8.1.78
numpy==1.23.5
tensorflow-cpu==2.12.0
```

### Frontend

#### React Application
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.5",
  "typescript": "^4.9.5",
  "axios": "^1.13.1",
  "face-api.js": "^0.22.2",
  "@tensorflow/tfjs": "^3.21.0",
  "@craco/craco": "^7.1.0"
}
```

### Database
- **MongoDB Atlas** (Cloud-hosted)
- **Mongoose ODM** for schema validation

### External Services
- **Brevo API** (formerly Sendinblue) - Email service
- **HaveIBeenPwned API** - Breach detection
- **MongoDB Atlas** - Database hosting
- **Hugging Face Spaces** - Backend hosting
- **GitHub Pages** - Frontend hosting

---

## 💾 Database Schema

### User Collection
```javascript
{
  email: String (unique, required),
  masterPasswordHash: String (bcrypt), // Never the actual master password
  salt: String,
  encryptedVaultKey: String, // Encrypted with master password
  
  // 2FA Settings
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  
  // Face Authentication
  faceAuthEnabled: Boolean,
  faceAuthTemplate: String, // Base64 encoded embedding
  
  // Email OTP
  emailOTP: String (hashed),
  emailOTPExpires: Date,
  emailOTPRequestedAt: Date,
  emailOTPAttempts: Number,
  emailOTPLockedUntil: Date,
  
  // Security
  loginAttempts: Number,
  lockUntil: Date,
  lastLogin: Date,
  
  // Verification
  isVerified: Boolean,
  verifyToken: String,
  verifyExpires: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Password Collection
```javascript
{
  userId: ObjectId (ref: User, indexed),
  encryptedData: String, // AES encrypted password data
  
  // Metadata (unencrypted for search/filter)
  website: String,
  category: String (enum),
  favorite: Boolean,
  
  // Security
  securityScore: Number (0-100),
  breached: Boolean,
  lastBreachCheck: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastUsed: Date
}
```

---

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Create new account | No |
| POST | `/login` | Login with password | No |
| GET | `/me` | Get current user info | Yes |
| POST | `/send-otp` | Request email OTP | No |
| POST | `/verify-signup-otp` | Verify registration OTP | No |
| POST | `/verify-login-otp` | Verify login OTP | No |
| POST | `/face/enroll` | Register face template | Yes |
| POST | `/face/verify` | Login with face | No |
| POST | `/face/disable` | Disable face auth | Yes |
| POST | `/2fa/setup` | Setup TOTP 2FA | Yes |
| POST | `/2fa/verify` | Verify 2FA setup | Yes |
| POST | `/2fa/disable` | Disable TOTP 2FA | Yes |

### Password Routes (`/api/passwords`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all passwords | Yes |
| GET | `/:id` | Get single password | Yes |
| POST | `/` | Create password | Yes |
| PUT | `/:id` | Update password | Yes |
| DELETE | `/:id` | Delete password | Yes |
| GET | `/stats/overview` | Get password stats | Yes |

### Security Routes (`/api/security`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/check-breach` | Check password breach | Yes |
| POST | `/analyze-strength` | Analyze password strength | Yes |
| POST | `/generate-password` | Generate secure password | Yes |

### DeepFace Routes (Python Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/enroll` | Extract face embedding |
| POST | `/api/verify` | Verify face match |

---

## 🔒 Security Features Summary

### 1. **Encryption**
- ✅ Client-side AES-256 encryption
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT tokens for session management
- ✅ Salt generation for each user

### 2. **Multi-Factor Authentication**
- ✅ Email OTP (6-digit, 10-min expiry)
- ✅ TOTP Authenticator (RFC 6238)
- ✅ Face Recognition (Facenet512)
- ✅ Optional combinations supported

### 3. **Attack Prevention**
- ✅ Rate limiting (100 req/15min)
- ✅ Account lockout after failed attempts
- ✅ CSRF protection via JWT
- ✅ XSS protection (Helmet.js)
- ✅ SQL injection prevention (Mongoose)
- ✅ Input validation (express-validator)

### 4. **Privacy**
- ✅ Zero-knowledge architecture
- ✅ Server never sees plaintext passwords
- ✅ Face embeddings (not images) stored
- ✅ OTP hashed in database
- ✅ k-Anonymity for breach checking

### 5. **Monitoring**
- ✅ Login alerts via email
- ✅ Device and location tracking
- ✅ Last login timestamp
- ✅ Failed attempt logging

---

## 🎨 Frontend Components

### React Components (TypeScript)

#### 1. **Login.tsx**
- Email/password input
- OTP verification modal
- Face recognition option
- Link to registration

#### 2. **Register.tsx**
- Email validation
- Master password creation
- Password strength indicator
- OTP verification flow

#### 3. **Dashboard.tsx**
- Password list display
- Search and filter
- Add/Edit/Delete passwords
- Quick actions (copy username/password)
- Category filtering
- Favorite toggle
- Stats overview

#### 4. **PasswordModal.tsx**
- Add/Edit password form
- Website URL input
- Category selection
- Password generator integration
- Strength analyzer
- Breach checker
- Notes field

#### 5. **PasswordItem.tsx**
- Individual password card
- Masked password display
- Copy to clipboard
- Quick edit/delete
- Favorite star
- Security score badge
- Breach warning

#### 6. **Settings.tsx**
- Enable/disable face auth
- Setup/disable 2FA
- Change master password
- Export vault (future)
- Delete account (future)

#### 7. **FaceEnroll.tsx**
- Webcam access
- Face detection overlay
- Capture and enrollment
- Success/error feedback

#### 8. **FaceAuth.tsx**
- Real-time face detection
- Verification progress
- Authentication result

### Standalone HTML Pages

#### 1. **index.html**
Landing page with feature showcase

#### 2. **login-standalone-with-otp.html**
Complete login flow without React
- Email/password form
- OTP input
- 2FA input
- Face auth button

#### 3. **register-standalone-with-otp.html**
Registration with OTP verification

#### 4. **dashboard-standalone.html**
Password management interface
- Full CRUD operations
- Client-side encryption
- Search and filter

#### 5. **settings-standalone.html**
User settings management
- 2FA setup
- Face auth enrollment
- Account settings

#### 6. **face-auth-standalone.html**
Dedicated face authentication page

#### 7. **forgot-password.html**
Password reset flow with OTP

---

## 🚀 Deployment Configuration

### Environment Variables

#### Node.js Backend (.env)
```env
PORT=7860
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-here
BREVO_API_KEY=your-brevo-api-key-here
NODE_ENV=production
```

#### Frontend (config.js)
```javascript
PRODUCTION: {
  API_BASE_URL: 'https://epscord-password-manager-api.hf.space',
  DEEPFACE_URL: 'https://epscord-password-manager-deepface.hf.space'
}
```

### Hosting Configuration

#### Hugging Face Spaces (Node.js)
```yaml
title: Password Manager API
sdk: docker
port: 7860
```

#### Hugging Face Spaces (Python)
```yaml
title: Password Manager DeepFace
sdk: docker
port: 7860
python_version: 3.10
```

#### GitHub Pages
- Static files served from repository
- Custom domain support
- HTTPS enabled

---

## 📧 Email Notifications

### Email Service: Brevo (formerly Sendinblue)

#### 1. **OTP Verification Email**
**Sent:** During registration, login, password reset  
**Contains:**
- 6-digit verification code
- Purpose (signup/login/reset)
- Expiry time (10 minutes)
- Security warning

#### 2. **Welcome Email**
**Sent:** After successful email verification  
**Contains:**
- Welcome message
- Feature highlights
- Security tips
- Getting started guide

#### 3. **Login Alert**
**Sent:** After every successful login  
**Contains:**
- Device information (browser, OS)
- IP address
- Location (city, country)
- Timestamp (IST timezone)
- Warning for unauthorized access

#### 4. **Password Reset Confirmation** (Future)
**Sent:** After password change  
**Contains:**
- Confirmation message
- Action timestamp
- Security contact info

### Email Template Design
- Modern, responsive HTML design
- Consistent branding (purple gradient)
- Mobile-friendly
- Professional typography
- Clear call-to-action buttons

---

## 📊 Statistics & Analytics

### Password Vault Statistics
- Total passwords stored
- Weak passwords count
- Breached passwords count
- Average security score
- Most used categories
- Recent activity

### User Dashboard Metrics
- Last login timestamp
- Active 2FA methods
- Security status
- Account age

---

## 🧪 Testing & Validation

### Input Validation
- Email format validation
- Password strength requirements
- SQL injection prevention
- XSS attack prevention
- File upload validation (face images)

### Error Handling
- User-friendly error messages
- Detailed server logs
- Graceful degradation
- Fallback mechanisms

---

## 🔮 Future Enhancements (Not Yet Implemented)

1. **Backup & Recovery**
   - Encrypted vault export
   - Import from other password managers
   - Backup codes for 2FA

2. **Advanced Features**
   - Password sharing (encrypted)
   - Secure notes
   - Credit card storage
   - Identity information
   - Digital wallet integration

3. **Security Enhancements**
   - WebAuthn/FIDO2 support
   - Biometric authentication (fingerprint)
   - Security key support (YubiKey)
   - Passkey support

4. **User Experience**
   - Browser extension
   - Mobile app (React Native)
   - Auto-fill functionality
   - Password health dashboard

5. **Admin Features**
   - User management
   - Usage analytics
   - Audit logs
   - Compliance reports

---

## 📝 Summary

### What We Have Built

This is a **production-ready, secure password manager** with the following key achievements:

✅ **Zero-Knowledge Architecture** - Server never sees plaintext data  
✅ **Multiple Authentication Methods** - Face, OTP, TOTP (2FA)  
✅ **Client-Side Encryption** - AES-256 with PBKDF2 key derivation  
✅ **Professional Email System** - Transactional emails via Brevo API  
✅ **Advanced Face Recognition** - DeepFace with Facenet512  
✅ **Breach Detection** - HaveIBeenPwned API integration  
✅ **Password Analytics** - Strength scoring and feedback  
✅ **Secure Password Generation** - Cryptographically random  
✅ **Rate Limiting & Protection** - DDoS prevention  
✅ **Responsive UI** - React TypeScript + Standalone HTML  
✅ **Cloud Deployment** - Hugging Face + MongoDB Atlas  

### Lines of Code
- **Backend (Node.js):** ~2,500 lines
- **Backend (Python):** ~116 lines
- **Frontend (React):** ~3,000+ lines
- **Standalone HTML:** ~5,000+ lines
- **Total:** ~10,000+ lines of code

### Database Collections
- Users: 140 lines schema
- Passwords: 60 lines schema

### API Endpoints
- **Total:** 20+ RESTful endpoints
- **Auth:** 12 endpoints
- **Passwords:** 5 endpoints
- **Security:** 3 endpoints
- **Face:** 2 endpoints

---

## 👨‍💻 Development Team

**Developer:** [Your Name]  
**Institution:** VIT  
**Project Type:** Final Year Project  
**Year:** 2025-2026  
**Status:** Review 1 Complete ✅

---

## 📚 References & Documentation

1. **DeepFace:** https://github.com/serengil/deepface
2. **Facenet512:** https://arxiv.org/abs/1503.03832
3. **TOTP RFC 6238:** https://tools.ietf.org/html/rfc6238
4. **HaveIBeenPwned API:** https://haveibeenpwned.com/API/v3
5. **MongoDB Documentation:** https://docs.mongodb.com/
6. **React Documentation:** https://react.dev/
7. **Express.js:** https://expressjs.com/
8. **JWT:** https://jwt.io/

---

**End of Documentation**  
*Last Updated: February 15, 2026*
