const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const axios = require('axios');
const useragent = require('useragent');

// Function to send login email
// Updated Login Alert using Brevo API
async function sendLoginAlert(email, ip, device, location) {
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: auto; border-top: 6px solid #ef4444; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #111827; margin-top: 0;">Security Notification</h2>
            <p style="color: #4b5563; font-size: 16px;">A new login was detected for your account.</p>
            
            <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: #374151;"><strong>Device:</strong> ${device}</p>
                <p style="margin: 0 0 10px 0; color: #374151;"><strong>Location:</strong> ${location.city}, ${location.country}</p>
                <p style="margin: 0 0 10px 0; color: #374151;"><strong>IP Address:</strong> ${ip}</p>
                <p style="margin: 0; color: #374151;"><strong>Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                If this was you, you can safely ignore this email. If not, please change your master password immediately to secure your vault.
            </p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Secure Password Manager · VIT Final Year Project</p>
        </div>
    </div>`;

    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: "Security Team", email: "eraiyamuthu57@gmail.com" },
            to: [{ email: email }],
            subject: "Security Alert: New Login Detected",
            htmlContent: htmlContent
        }, {
            headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
        });
        console.log(`✅ Professional Login alert sent to ${email}`);
    } catch (error) {
        console.error("❌ Login alert failed:", error.message);
    }
}

// NEW: WELCOME EMAIL AFTER REGISTRATION
async function sendWelcomeEmail(email) {
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Welcome!</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Your secure vault is ready.</p>
        </div>
        <div style="padding: 40px; background-color: #ffffff; color: #374151; line-height: 1.6;">
            <p style="font-size: 16px;">Hi there,</p>
            <p>Thank you for choosing <strong>Secure Password Manager</strong>. Your email has been successfully verified, and your account is now fully active.</p>
            <p>With your new vault, you can:</p>
            <ul style="color: #4b5563;">
                <li>Store encrypted passwords safely</li>
                <li>Access your data with Face Recognition</li>
                <li>Enable Multi-Factor Authentication (MFA)</li>
            </ul>
            <p style="margin-top: 30px; font-weight: bold; color: #111827;">Stay safe and secure!</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; 2026 Password Manager Security Team</p>
        </div>
    </div>`;

    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: "Password Manager", email: "eraiyamuthu57@gmail.com" },
            to: [{ email: email }],
            subject: "Welcome to Password Manager!",
            htmlContent: htmlContent
        }, {
            headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
        });
        console.log(`✅ Professional Welcome email sent to ${email}`);
    } catch (error) {
        console.error("❌ Welcome email failed:", error.message);
    }
}

// =================== REGISTER ===================
// =================== REGISTER (FIXED) ===================
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('masterPasswordHash').isLength({ min: 8 }),
  body('encryptedVaultKey').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, masterPasswordHash, encryptedVaultKey, salt } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(masterPasswordHash, 12);

    user = new User({
      email,
      masterPasswordHash: hashedPassword,
      encryptedVaultKey,
      salt: salt || ''
    });

    await user.save();

    // Generate OTP
    const otp = generateOTP(); 
    user.emailOTP = await bcrypt.hash(otp, 10);
    user.emailOTPExpires = Date.now() + (10 * 60 * 1000); 
    user.emailOTPRequestedAt = Date.now();
    await user.save();

    // Send OTP email (Welcome email now happens AFTER verification)
    try {
      await sendOTPEmail(user.email, otp, 'signup');
      console.log(`✅ Registration OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send registration OTP:', emailError.message);
    }

    res.status(201).json({
      success: true,
      requiresEmailOTP: true,
      message: 'Registration successful! Please check your email for the verification code.',
      email: user.email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});


// =================== LOGIN (RISK-ADAPTIVE) ===================
/**
 * PRIVACY-PRESERVING, CLIENT-SIDE RISK-ADAPTIVE AUTHENTICATION
 * 
 * This endpoint:
 * 1. Accepts challengeLevel from CLIENT (not server-determined)
 * 2. Does NOT calculate or infer risk
 * 3. Does NOT receive raw risk signals (typing, device, timing)
 * 4. Blindly verifies credentials based on requested challenge level
 * 
 * CHALLENGE LEVELS:
 * Level 1: Password only
 * Level 2: Password + Email OTP
 * Level 3: Password + Face Recognition
 * Level 4: Password + Face + TOTP
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('masterPasswordHash').notEmpty(),
  body('challengeLevel').isInt({ min: 1, max: 4 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, masterPasswordHash, challengeLevel, additionalToken } = req.body;
    
    // Default to Level 1 if not provided (backward compatibility)
    const requestedLevel = challengeLevel || 1;

    console.log('═══════════════════════════════════════════════');
    console.log('🔐 LOGIN REQUEST');
    console.log('Email:', email);
    console.log('Challenge Level:', requestedLevel, '(CLIENT-DETERMINED)');
    console.log('═══════════════════════════════════════════════');

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account lock
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${lockTime} minutes`
      });
    }

    // Verify master password
    const isMatch = await user.comparePassword(masterPasswordHash);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + (15 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('✅ Password verified');

    // HANDLE CHALLENGE LEVELS
    // Server BLINDLY executes the challenge requested by client
    // Server does NOT override or question the client's decision

    switch (requestedLevel) {
      case 1:
        // LEVEL 1: Password only
        console.log('🔓 Level 1: Password-only authentication');
        break;

      case 2:
        // LEVEL 2: Password + Email OTP
        console.log('📧 Level 2: Email OTP required');
        
        if (!additionalToken) {
          // Generate and send OTP
          const otp = generateOTP();
          user.emailOTP = await bcrypt.hash(otp, 10);
          user.emailOTPExpires = Date.now() + (10 * 60 * 1000); // 10 minutes
          user.emailOTPRequestedAt = Date.now();
          user.emailOTPAttempts = 0;
          await user.save();
          
          try {
            await sendOTPEmail(user.email, otp, 'login');
            console.log(`✅ OTP sent to ${user.email}`);
          } catch (emailError) {
            console.error('❌ Failed to send OTP email:', emailError.message);
          }
          
          return res.status(200).json({
            success: false,
            requiresEmailOTP: true,
            message: 'Verification code sent to your email'
          });
        } else {
          // Verify OTP
          if (!user.emailOTP || !user.emailOTPExpires || user.emailOTPExpires < Date.now()) {
            return res.status(400).json({ 
              success: false, 
              message: 'OTP expired. Please request a new one.' 
            });
          }

          const otpMatch = await bcrypt.compare(additionalToken, user.emailOTP);
          if (!otpMatch) {
            user.emailOTPAttempts = (user.emailOTPAttempts || 0) + 1;
            
            if (user.emailOTPAttempts >= 5) {
              user.emailOTPLockedUntil = Date.now() + (15 * 60 * 1000);
              await user.save();
              return res.status(423).json({ 
                success: false, 
                message: 'Too many failed attempts. Account locked for 15 minutes.' 
              });
            }
            
            await user.save();
            return res.status(400).json({ 
              success: false, 
              message: 'Invalid verification code' 
            });
          }

          // Clear OTP after successful verification
          user.emailOTP = null;
          user.emailOTPExpires = null;
          user.emailOTPAttempts = 0;
          console.log('✅ Email OTP verified');
        }
        break;

      case 3:
        // LEVEL 3: Password + Face Recognition
        console.log('👤 Level 3: Face recognition required');
        // Face auth is handled separately via /auth/face/verify endpoint
        // Client should call that endpoint after password verification
        return res.status(200).json({
          success: false,
          requiresFaceAuth: true,
          message: 'Face authentication required'
        });

      case 4:
        // LEVEL 4: Password + Face + TOTP
        console.log('🔐 Level 4: Face + TOTP required');
        
        if (!additionalToken) {
          return res.status(200).json({
            success: false,
            requiresFaceAuth: true,
            requires2FA: true,
            message: 'Face authentication and TOTP required'
          });
        }

        // Verify TOTP
        if (!user.twoFactorEnabled) {
          return res.status(400).json({ 
            success: false, 
            message: '2FA is not enabled for this account' 
          });
        }

        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: additionalToken,
          window: 2
        });

        if (!verified) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid authenticator code' 
          });
        }

        console.log('✅ TOTP verified');
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid challenge level' 
        });
    }

    // Authentication successful - generate token
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = Date.now();
    await user.save();

    // Send login alert (optional, does not affect authentication)
    const userIP = req.headers["x-forwarded-for"] || req.ip;
    const agent = useragent.parse(req.headers["user-agent"]);
    const device = `${agent.family} on ${agent.os.family}`;

    let location = { city: "Unknown", country: "Unknown" };
    try {
      const response = await axios.get(`https://ipapi.co/${userIP}/json/`);
      location.city = response.data.city || "Unknown";
      location.country = response.data.country_name || "Unknown";
    } catch (e) {
      console.error("IP lookup failed:", e.message);
    }

    sendLoginAlert(user.email, userIP, device, location).catch(console.error);

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Authentication successful - Token issued');
    console.log('═══════════════════════════════════════════════');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        encryptedVaultKey: user.encryptedVaultKey,
        twoFactorEnabled: user.twoFactorEnabled,
        faceAuthEnabled: user.faceAuthEnabled,
        salt: user.salt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// =================== GET USER ===================
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        encryptedVaultKey: req.user.encryptedVaultKey,
        twoFactorEnabled: req.user.twoFactorEnabled,
        faceAuthEnabled: req.user.faceAuthEnabled,
        salt: req.user.salt,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =================== FACE ENROLL ===================
router.post('/face/enroll', auth, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    if (!faceDescriptor) {
      return res.status(400).json({ success: false, message: 'Face descriptor required' });
    }

    req.user.faceAuthTemplate = faceDescriptor;
    req.user.faceAuthEnabled = true;
    await req.user.save();

    res.json({ success: true, message: 'Face enrolled successfully' });
  } catch (error) {
    console.error('Face enroll error:', error);
    res.status(500).json({ success: false, message: 'Enrollment failed' });
  }
});

// =================== FACE VERIFY (PUBLIC) ===================
router.post('/face/verify', async (req, res) => {
  try {
    console.log('--- /face/verify called ---');
    const { email, faceDescriptor } = req.body;

    if (!email || !faceDescriptor) {
      console.error('Missing email or faceDescriptor');
      return res.status(400).json({ success: false, message: 'Email and face descriptor required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });
    if (!user.faceAuthEnabled || !user.faceAuthTemplate) {
      return res.status(400).json({ success: false, message: 'Face authentication not enabled' });
    }

    function base64ToFloat32Array(b64) {
      const buf = Buffer.from(b64, 'base64');
      return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
    }

    const stored = base64ToFloat32Array(user.faceAuthTemplate);
    const incoming = base64ToFloat32Array(faceDescriptor);

    // --- COSINE DISTANCE (Better Accuracy) ---
    function cosineDistance(a, b) {
      let dot = 0.0, normA = 0.0, normB = 0.0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return 1 - dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    const distance = cosineDistance(stored, incoming);
    console.log('Cosine distance:', distance);

    const FACE_MATCH_THRESHOLD = 0.45; // Lower = stricter, try 0.4–0.5
    if (distance < FACE_MATCH_THRESHOLD) {
      console.log('✅ Face recognized!');
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          encryptedVaultKey: user.encryptedVaultKey,
          twoFactorEnabled: user.twoFactorEnabled,
          faceAuthEnabled: user.faceAuthEnabled,
          salt: user.salt
        }
      });
    } else {
      console.warn('❌ Face not recognized. Distance too high:', distance);
      res.json({ success: false, message: `Face not recognized (distance: ${distance.toFixed(3)})` });
    }
  } catch (error) {
    console.error('Face verify error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// =================== FACE DISABLE ===================
router.post('/face/disable', auth, async (req, res) => {
  try {
    req.user.faceAuthEnabled = false;
    req.user.faceAuthTemplate = null;
    await req.user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// =================== 2FA SETUP ===================
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    console.log('=== 2FA Setup Request ===');
    console.log('User ID:', req.user._id);
    console.log('User email:', req.user.email);
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Password Manager (${req.user.email})`,
      length: 32
    });

    console.log('Generated secret:', secret.base32);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store temporarily (don't enable until verified)
    req.user.twoFactorSecret = secret.base32;
    const savedUser = await req.user.save();
    
    console.log('Secret saved to DB:', !!savedUser.twoFactorSecret);
    console.log('Saved secret value:', savedUser.twoFactorSecret);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to setup 2FA' });
  }
});

// =================== 2FA VERIFY & ENABLE ===================
router.post('/2fa/verify', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    console.log('=== 2FA Verify Request ===');
    console.log('Request body:', req.body);
    console.log('Token received:', token);
    console.log('User ID:', req.user._id);
    console.log('User has twoFactorSecret:', !!req.user.twoFactorSecret);

    if (!token || !req.user.twoFactorSecret) {
      console.error('Validation failed - token:', !!token, 'secret:', !!req.user.twoFactorSecret);
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
    }

    req.user.twoFactorEnabled = true;
    await req.user.save();

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// =================== 2FA DISABLE ===================
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    req.user.twoFactorEnabled = false;
    req.user.twoFactorSecret = null;
    await req.user.save();
    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
});

// =================== EMAIL OTP HELPERS ===================
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

async function sendOTPEmail(email, otp, purpose = 'login') {
    console.log(`🔑 [DEMO LOG] OTP for ${email} is: ${otp}`);
    const subjects = {
        signup: "Verify your new account",
        login: "Your login verification code",
        reset: "Password reset request"
    };

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">Password Manager</h1>
        </div>
        <div style="padding: 40px; text-align: center; background-color: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 10px;">Verification Code</h2>
            <p style="color: #6b7280; font-size: 16px; margin-bottom: 30px;">Use the code below to complete your ${purpose}.</p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
                <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; 2026 Password Manager Security Team · VIT Project</p>
        </div>
    </div>`;

    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: "Security Team", email: "eraiyamuthu57@gmail.com" },
            to: [{ email: email }],
            subject: subjects[purpose] || "Security Verification",
            htmlContent: htmlContent
        }, {
            headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
        });
    } catch (error) { console.error("❌ Email failed:", error.message); }
}

// =================== SEND EMAIL OTP (DURING REGISTRATION) ===================
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body; // purpose: 'signup' or 'login'
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const user = await User.findOne({ email });
    
    // For signup: user should exist but not have verified
    // For login: user must exist
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Check if user is locked out
    if (user.emailOTPLockedUntil && user.emailOTPLockedUntil > Date.now()) {
      const lockMinutes = Math.ceil((user.emailOTPLockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Too many failed attempts. Try again in ${lockMinutes} minutes.`
      });
    }

    // Rate limiting: 60 seconds between requests
    if (user.emailOTPRequestedAt && (Date.now() - user.emailOTPRequestedAt.getTime()) < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - user.emailOTPRequestedAt.getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting another code.`
      });
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.emailOTP = await bcrypt.hash(otp, 10); // Hash the OTP
    user.emailOTPExpires = Date.now() + (10 * 60 * 1000); // 10 minutes
    user.emailOTPRequestedAt = Date.now();
    user.emailOTPAttempts = 0; // Reset attempts on new OTP
    await user.save();

    // Send email
    await sendOTPEmail(email, otp, purpose);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 600 // seconds
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
});

// =================== VERIFY SIGNUP OTP ===================
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Check lockout
    if (user.emailOTPLockedUntil && user.emailOTPLockedUntil > Date.now()) {
      const lockMinutes = Math.ceil((user.emailOTPLockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${lockMinutes} minutes.`
      });
    }

    // Check if OTP exists and not expired
    if (!user.emailOTP || !user.emailOTPExpires) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
    }

    if (user.emailOTPExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one.' });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, user.emailOTP);
    if (!isValid) {
      user.emailOTPAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.emailOTPAttempts >= 5) {
        user.emailOTPLockedUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 30 minutes.'
        });
      }
      
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Invalid code. ${5 - user.emailOTPAttempts} attempts remaining.`
      });
    }

    // Success! Clear OTP fields and generate token
    user.emailOTP = null;
    user.emailOTPExpires = null;
    user.emailOTPRequestedAt = null;
    user.emailOTPAttempts = 0;
    user.emailOTPLockedUntil = null;
    user.isVerified = true; // Mark as verified
    await user.save();
    
    await sendWelcomeEmail(user.email);
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        encryptedVaultKey: user.encryptedVaultKey,
        salt: user.salt
      }
    });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// =================== VERIFY LOGIN OTP ===================
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    if (user.emailOTPLockedUntil && user.emailOTPLockedUntil > Date.now()) {
      const lockMinutes = Math.ceil((user.emailOTPLockedUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Locked. Try again in ${lockMinutes} mins.` });
    }

    if (!user.emailOTP || user.emailOTPExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }

    const isValid = await bcrypt.compare(otp, user.emailOTP);
    if (!isValid) {
      user.emailOTPAttempts += 1;
      if (user.emailOTPAttempts >= 5) {
        user.emailOTPLockedUntil = Date.now() + (30 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid code.' });
    }

    // SUCCESS LOGIC
    user.emailOTP = null;
    user.emailOTPExpires = null;
    user.emailOTPAttempts = 0;
    user.lastLogin = Date.now();
    await user.save();

    // Inside router.post('/verify-login-otp', ...)
// After: await user.save(); (The part where you clear the OTP)

// 1. Capture the real User IP from the Hugging Face proxy
    const userIP = req.headers["x-forwarded-for"]?.split(',')[0] || req.ip;

// 2. Initialize location as Unknown
    let location = { city: "Unknown", country: "Unknown" }; 

    try {
    // 3. Attempt to fetch live geolocation data
      const response = await axios.get(`https://ipapi.co/${userIP}/json/`);
    
    // 4. Only update if the API returns valid data
        if (response.data && !response.data.error) {
          location.city = response.data.city || "Unknown";
          location.country = response.data.country_name || "Unknown";
        }
      } catch (e) {
    console.error("IP lookup failed:", e.message);
    }

// 5. Pass the fetched location to the alert function
    const agent = useragent.parse(req.headers["user-agent"]);
    const device = `${agent.family} on ${agent.os.family}`;

    sendLoginAlert(user.email, userIP, device, location).catch(console.error);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        encryptedVaultKey: user.encryptedVaultKey,
        twoFactorEnabled: user.twoFactorEnabled,
        faceAuthEnabled: user.faceAuthEnabled,
        salt: user.salt
      }
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// =================== RESEND OTP ===================
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body; // purpose: 'signup' or 'login'

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Check lockout
    if (user.emailOTPLockedUntil && user.emailOTPLockedUntil > Date.now()) {
      const lockMinutes = Math.ceil((user.emailOTPLockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${lockMinutes} minutes.`
      });
    }

    // Rate limiting: 60 seconds between requests
    if (user.emailOTPRequestedAt && (Date.now() - user.emailOTPRequestedAt.getTime()) < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - user.emailOTPRequestedAt.getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting another code.`
      });
    }

    // Generate and save new OTP
    const otp = generateOTP();
    user.emailOTP = await bcrypt.hash(otp, 10);
    user.emailOTPExpires = Date.now() + (10 * 60 * 1000); // 10 minutes
    user.emailOTPRequestedAt = Date.now();
    user.emailOTPAttempts = 0; // Reset attempts
    await user.save();

    // Send email
    await sendOTPEmail(email, otp, purpose);

    res.json({
      success: true,
      message: 'New verification code sent',
      expiresIn: 600
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend code' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // ✅ FIXED: Using your Brevo function
    await sendOTPEmail(email, otp, 'reset');

    res.json({ success: true, message: 'Verification code sent to your email' });
} catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send code' });
}
});

// Verify Reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if OTP exists and hasn't expired
    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
      return res.status(400).json({ success: false, message: 'No reset code found. Please request a new one.' });
    }

    if (new Date() > user.resetPasswordOTPExpiry) {
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email, purpose: 'reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    res.json({ success: true, resetToken, message: 'Verification successful' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Reset Password
// Reset Password - FINAL WORKING VERSION
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      if (decoded.purpose !== 'reset') throw new Error('Invalid token purpose');
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 1. Update Password in DB
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.masterPasswordHash = hashedPassword;

    // Clear reset OTP fields and unlock account
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // 2. Send confirmation via Brevo
    // Replacement for the email block in /reset-password
try {
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset Successful</h1>
        </div>
        <div style="padding: 40px; background-color: #ffffff; color: #374151; text-align: center;">
            <p style="font-size: 16px;">Your master password has been changed successfully.</p>
            <p style="color: #6b7280; margin-top: 10px;">You can now use your new password to log in and access your secure vault.</p>
            <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; color: #166534; border-radius: 8px; font-size: 14px;">
                If you did not perform this action, please contact support immediately.
            </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Password Manager Security Team</p>
        </div>
    </div>`;

    await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: "Security Team", email: "eraiyamuthu57@gmail.com" },
        to: [{ email: email }],
        subject: 'Security Notice: Password Changed',
        htmlContent: htmlContent
    }, {
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
    });
} catch (emailError) {
    console.error('❌ Reset confirmation email failed:', emailError.message);
}

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

module.exports = router;
