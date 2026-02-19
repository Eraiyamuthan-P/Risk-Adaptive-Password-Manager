# 🔐 Risk-Adaptive Password Manager

A **Privacy-Preserving, Zero-Knowledge Password Manager** with **Risk-Adaptive Authentication Framework** using behavioral biometrics, device fingerprinting, and explainable AI.

## 🎯 Key Features

### 🔒 **Zero-Knowledge Architecture**
- Client-side AES-256 encryption
- PBKDF2 key derivation (100,000 iterations)
- Server never sees plaintext passwords or vault keys
- Master password never transmitted

### 🧠 **Risk-Adaptive Authentication**
- **4 Risk Assessment Modules:**
  - **Device Risk**: Browser fingerprinting & device familiarity
  - **Behavior Risk**: Keystroke dynamics & typing patterns
  - **Time Risk**: Temporal login patterns & anomalies
  - **Credential Risk**: Failed login attempt detection
- **Privacy-First**: All profiling happens client-side in browser localStorage
- **Quorum Logic**: ≥2 HIGH risks → Overall HIGH risk
- **Dynamic MFA**: Challenge level (1-4) adapts to assessed risk

### 🔐 **Multi-Factor Authentication**
- **Level 1**: Password only (familiar device, normal behavior)
- **Level 2**: Password + Email OTP (moderate risk)
- **Level 3**: Password + Face Recognition (high risk, new device)
- **Level 4**: Password + TOTP Authenticator (user-requested max security)

### 👤 **Face Recognition**
- DeepFace (Facenet512) for face verification
- Python Flask backend for embedding extraction
- Integrated with risk-adaptive system

### 💡 **Explainable AI (XAI)**
- Human-readable explanations for authentication decisions
- Transparency about why MFA is required
- User-friendly risk factor display

### 🛡️ **Security Features**
- Password breach detection (HaveIBeenPwned API)
- Password strength analyzer with visual feedback
- Account lockout after 5 failed attempts (15 min)
- Email alerts on login from new devices
- JWT-based authentication with expiration

## 🏗️ Architecture

### **Technology Stack**
- **Frontend**: Standalone HTML/CSS/JavaScript (no framework dependencies)
- **Backend**: 
  - Node.js (Express.js) - Main API server
  - Python (Flask + DeepFace) - Face recognition
- **Database**: MongoDB Atlas (cloud)
- **Authentication**: JWT, Bcrypt, Speakeasy (TOTP)
- **Email**: Brevo API for OTP delivery

### **Project Structure**
```
├── login-standalone-with-otp.html   # Main login with risk assessment
├── face-auth-standalone.html        # Face recognition page
├── dashboard-standalone.html        # Password vault
├── settings-standalone.html         # User settings
├── config.js                        # API endpoint configuration
├── server/
│   ├── server.js                    # Node.js Express server
│   ├── routes/auth.js               # Authentication endpoints
│   ├── models/User.js               # User schema
│   └── deepface_backend.py          # Face recognition API
└── client/                          # React build (alternative interface)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Eraiyamuthan-P/Risk-Adaptive-Password-Manager.git
cd Risk-Adaptive-Password-Manager
```

2. **Install Node.js dependencies**
```bash
cd server
npm install
```

3. **Install Python dependencies**
```bash
cd server
pip install -r requirements.txt
```

4. **Configure environment variables**
Create `.env` file in `server/`:
```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
BREVO_API_KEY=your_brevo_api_key
```

5. **Update API endpoints**
Edit `config.js` with your deployment URLs:
```javascript
PRODUCTION: {
    API_BASE_URL: 'https://your-node-backend.com',
    DEEPFACE_URL: 'https://your-python-backend.com'
}
```

### Running Locally

1. **Start Node.js server**
```bash
cd server
node server.js
```

2. **Start Python DeepFace backend**
```bash
cd server
python deepface_backend.py
```

3. **Open in browser**
```
http://localhost:5000/login-standalone-with-otp.html
```

## 📊 Risk Assessment Algorithm

### Client-Side Risk Calculation
```javascript
1. Capture behavioral biometrics (typing patterns)
2. Generate device fingerprint (browser, screen, timezone)
3. Analyze login time patterns
4. Check credential failure history

5. Calculate individual risks:
   - Device: NEW/90+ days = HIGH, 30+ days = MEDIUM, <30 days = LOW
   - Behavior: >50% deviation = HIGH, >30% = MEDIUM, <30% = LOW
   - Time: Outside 2σ = HIGH, outside 1σ = MEDIUM, within 1σ = LOW
   - Credential: ≥3 failures = HIGH, ≥1 = MEDIUM, 0 = LOW

6. Apply Quorum Logic:
   - ≥2 HIGH → Overall HIGH → Challenge Level 3
   - ≥1 HIGH or ≥2 MEDIUM → Overall MEDIUM → Challenge Level 2
   - Otherwise → Overall LOW → Challenge Level 1

7. Send ONLY challengeLevel to server (privacy-preserving)
```

### Server-Side Challenge Execution
```javascript
switch (challengeLevel) {
    case 1: return JWT token immediately
    case 2: send email OTP, require verification
    case 3: require face authentication
    case 4: require TOTP authenticator code
}
```

## 🔐 Privacy & Security

### ✅ **Privacy Strengths**
- All behavioral data stays client-side (localStorage)
- Server never sees device fingerprints, typing patterns, or risk scores
- Zero-knowledge encryption - server cannot decrypt vault
- Explainable AI provides transparency

### ⚠️ **Security Considerations**
- Client-side risk assessment can be bypassed with DevTools
  - **Mitigation**: Server logs challengeLevel for anomaly detection
- localStorage profiles can be cleared
  - **Expected behavior**: First login treated as new device
- Face recognition requires camera access
  - **Privacy**: Face embeddings stored, not raw images

## 📈 Evaluation & Testing

### Test Scenarios
1. **Normal Login (Familiar Device)**: Challenge Level 1
2. **New Device**: Challenge Level 3 (Face Auth)
3. **Unusual Time (3 AM)**: Challenge Level 2-3
4. **Failed Login → Retry**: Elevated challenge level
5. **2FA Authenticator**: Always Level 4

### Console Testing
```javascript
// Check device profile
console.log(JSON.parse(localStorage.getItem('device_profile_user@example.com')));

// Check behavior baseline
console.log(JSON.parse(localStorage.getItem('behavior_baseline_user@example.com')));

// Simulate login scenarios
AuthSimulator.runFullSimulation('user@example.com');
```

## 📝 Documentation

- [INTEGRATION_ANALYSIS.md](INTEGRATION_ANALYSIS.md) - Complete compatibility analysis
- [QUICK_SUMMARY.md](QUICK_SUMMARY.md) - Project overview
- [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md) - All 34+ features
- [PROJECT_REVIEW_1_DOCUMENTATION.md](PROJECT_REVIEW_1_DOCUMENTATION.md) - Architecture details

## 🎓 Academic Context

This project implements concepts from:
- Behavioral Biometrics (keystroke dynamics)
- Risk-Adaptive Authentication
- Zero-Knowledge Encryption
- Explainable AI (XAI) for security decisions
- Privacy-Preserving Authentication

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Eraiyamuthan P**
- GitHub: [@Eraiyamuthan-P](https://github.com/Eraiyamuthan-P)
- Email: eraiamuthu57@gmail.com

## 🙏 Acknowledgments

- DeepFace library for face recognition
- face-api.js for browser-based face detection
- MongoDB Atlas for database hosting
- Hugging Face Spaces for deployment

---

⭐ **Star this repo if you find it useful!**

🔒 **Built with privacy and security in mind**
