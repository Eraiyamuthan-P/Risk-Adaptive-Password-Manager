# 🧪 Testing Risk-Adaptive Authentication - Complete Guide

## 🎯 Overview
This guide helps you test the risk-adaptive authentication system from scratch by clearing all previous login behaviors.

---

## 📋 Quick Start

### **Step 1: Open Testing Tool**
Open in browser: `reset-behaviors.html`

### **Step 2: Clear Data for Test Email**
1. Enter email address (e.g., `test@example.com`)
2. Click **"Clear Browser Data"** (clears localStorage)
3. Click **"Reset Server Data"** (clears MongoDB)
4. ✅ All login behaviors cleared!

### **Step 3: Test Different Scenarios**
Follow the testing scenarios below →

---

## 🧹 What Gets Cleared?

### **Client-Side (Browser)**
Cleared from `localStorage`:
- ✅ `device_profile_{email}` - Device fingerprints and recognition
- ✅ `behavior_baseline_{email}` - Typing pattern baselines
- ✅ `time_profile_{email}` - Login time patterns
- ✅ `credential_profile_{email}` - Failed attempt history

### **Server-Side (Database)**
Reset in MongoDB `User` document:
- ✅ `loginAttempts` → 0
- ✅ `lockUntil` → null
- ✅ `lastLogin` → null
- ✅ `emailOTPAttempts` → 0
- ✅ `emailOTPLockedUntil` → null
- ✅ `emailOTP` → null (clears any pending OTP)
- ✅ `emailOTPExpires` → null
- ✅ `emailOTPRequestedAt` → null

---

## 🧪 Testing Scenarios

### ✅ **Scenario 1: Normal Login (Low Risk → Level 1)**

**Goal:** Familiar device, normal behavior → Password-only authentication

**Steps:**
1. Clear data for: `test@example.com`
2. Login successfully 2-3 times from same browser
3. Close browser and reopen
4. Login again with correct password

**Expected Result:**
```
✅ Standard Authentication
Everything looks normal! Your device is recognized...

Challenge Level: 1 (Password Only)
Risk Factors:
  Device: LOW
  Typing Pattern: LOW
  Login Time: LOW
  Login History: LOW

→ Should log in directly without OTP or Face Auth
```

---

### 📧 **Scenario 2: New Device (Medium Risk → Level 2)**

**Goal:** Unfamiliar device → Email OTP required

**Steps:**
1. Clear data for: `test@example.com`
2. Login once from Chrome (establishes device profile)
3. **Open Firefox or Incognito mode** (new device fingerprint)
4. Login with same credentials

**Expected Result:**
```
🔐 Enhanced Security Required
For your security, we're requesting email verification 
because we detected: new or unfamiliar device

Challenge Level: 2 (Password + Email OTP)
Risk Factors:
  Device: HIGH ⚠️
  Typing Pattern: MEDIUM
  Login Time: LOW
  Login History: LOW

→ OTP page appears with explanation:
   "Your device fingerprint doesn't match previous logins"
→ 6-digit code sent to email
→ Enter code to complete login
```

---

### ⚠️ **Scenario 3: Failed Login Attempts (Medium Risk → Level 2)**

**Goal:** Multiple wrong passwords → Email OTP required

**Steps:**
1. Clear data for: `test@example.com`
2. Login successfully once (establishes baseline)
3. **Enter WRONG password 3 times**
4. Enter CORRECT password on 4th attempt

**Expected Result:**
```
🔐 Enhanced Security Required
Due to recent failed login attempts, we need additional verification.

Challenge Level: 2 (Password + Email OTP)
Risk Factors:
  Device: LOW
  Typing Pattern: LOW
  Login Time: LOW
  Login History: HIGH ⚠️

→ OTP page shows:
   "Multiple failed login attempts detected recently"
→ Must verify with email OTP to continue
```

---

### 🚨 **Scenario 4: High Risk (High Risk → Level 3)**

**Goal:** Multiple risk factors → Face Recognition required

**Steps:**
1. Clear data for: `test@example.com`
2. **Open Incognito/different browser** (new device)
3. **Enter wrong password 2 times**
4. Wait 5 minutes (unusual time gap)
5. Enter CORRECT password

**Expected Result:**
```
🚨 High-Risk Login Detected
This login shows 3 suspicious patterns. We need facial 
recognition to ensure it's really you.

Challenge Level: 3 (Password + Face Recognition)
Risk Factors:
  Device: HIGH ⚠️
  Typing Pattern: MEDIUM
  Login Time: MEDIUM
  Login History: HIGH ⚠️

→ Message displays detailed explanation
→ 3-second countdown animation
→ Redirects to face-auth-standalone.html
→ Must scan face to complete login
```

---

### 🕐 **Scenario 5: Unusual Time (Medium Risk → Level 2)**

**Goal:** Login at unusual hour → Email OTP required

**Setup:** You need to establish a time profile first

**Steps:**
1. Clear data for: `test@example.com`
2. Login successfully 3-4 times during **daytime** (e.g., 2-4 PM)
3. Wait until **late night or early morning** (e.g., 2-4 AM)
4. Login at that unusual time

**Expected Result:**
```
🔐 Enhanced Security Required
Due to unusual time of day, we need additional verification.

Challenge Level: 2 (Password + Email OTP)
Risk Factors:
  Device: LOW
  Typing Pattern: LOW
  Login Time: HIGH ⚠️
  Login History: LOW

→ OTP page shows:
   "You rarely log in at this time. Outside your normal hours"
```

**Note:** TimeRiskModule checks if current hour is outside the typical range from stored login history.

---

### ⌨️ **Scenario 6: Unusual Typing Pattern (Medium Risk → Level 2)**

**Goal:** Significantly different typing speed → Email OTP required

**Steps:**
1. Clear data for: `test@example.com`
2. Login by **typing password slowly** (2-3 times) to establish baseline
3. Clear password field
4. **Type password VERY FAST** (or very slow if you were fast)

**Expected Result:**
```
🔐 Enhanced Security Required
Due to unusual typing behavior, we need additional verification.

Challenge Level: 2 (Password + Email OTP)
Risk Factors:
  Device: LOW
  Typing Pattern: HIGH ⚠️
  Login Time: LOW
  Login History: LOW

→ OTP page shows:
   "Your typing pattern differs significantly from baseline"
```

**Note:** BehaviorRiskModule compares typing speed variance with stored baseline.

---

## 🛠️ Testing Best Practices

### ✅ DO:
- Clear data between major test scenarios
- Test with real email addresses you can access
- Check browser console (F12) for detailed risk logs
- Test on different browsers (Chrome, Firefox, Edge, Opera)
- Test on different devices (desktop, mobile, tablet)
- Allow 2-3 successful logins to build profiles before testing risks

### ❌ DON'T:
- Test with production/real user accounts
- Clear data in the middle of a test scenario
- Ignore server console logs (has valuable debugging info)
- Test too quickly (wait 60s between OTP requests to avoid rate limits)
- Forget to setup MongoDB connection (server needs to be running)

---

## 📊 Understanding Risk Calculation

### Risk Levels:
- **LOW**: Matches baseline, recognized device, normal time
- **MEDIUM**: Slight deviation from normal (1 factor)
- **HIGH**: Significant deviation or multiple factors

### Challenge Mapping:
```
Risk Level   →  Challenge Level  →  Authentication Required
──────────────────────────────────────────────────────────
LOW          →  Level 1          →  Password only
MEDIUM       →  Level 2          →  Password + Email OTP
HIGH         →  Level 3          →  Password + Face Recognition
```

### Quorum Logic:
```javascript
if (highRiskFactors >= 2) → HIGH risk
else if (highRiskFactors >= 1 OR mediumRiskFactors >= 2) → MEDIUM risk
else → LOW risk
```

---

## 🐛 Debugging Tips

### Check Browser Console (F12 → Console):
```
═══════════════════════════════════════════════
🔐 CLIENT-SIDE RISK ASSESSMENT
═══════════════════════════════════════════════
📊 DEVICE RISK: HIGH (new or unfamiliar device)
📊 BEHAVIOR RISK: LOW (typing within normal range)
📊 TIME RISK: MEDIUM (unusual hour)
📊 CREDENTIAL RISK: LOW (no recent failures)
────────────────────────────────────────────────
📊 QUORUM LOGIC APPLIED:
Overall Risk: MEDIUM → Challenge Level: 2
═══════════════════════════════════════════════
```

### Check Server Logs:
```
═══════════════════════════════════════════════
🔐 LOGIN REQUEST
Email: test@example.com
Challenge Level: 2 (CLIENT-DETERMINED)
═══════════════════════════════════════════════
✅ Password verified
📧 Level 2: Email OTP required
✅ OTP sent to test@example.com
```

### Common Issues:

| Problem | Solution |
|---------|----------|
| "Risk assessment not triggering" | Build profile first with 2-3 successful logins |
| "Always getting Level 1" | Check if device profile exists in localStorage |
| "Can't receive OTP" | Verify Brevo API key in Hugging Face Secrets |
| "Location shows Unknown" | Deploy updated auth.js with location fallback API |
| "Face auth not triggering" | Need 2+ HIGH risk factors (new device + failed attempts) |

---

## 📈 Tracking Test Results

### Create Test Log:

```markdown
## Test Session: [Date]

### Scenario 1: Normal Login
- Email: test@example.com
- Browser: Chrome  
- Result: ✅ Level 1 (Password only)
- Risk Factors: All LOW
- Notes: Worked as expected

### Scenario 2: New Device
- Email: test@example.com
- Browser: Firefox Incognito
- Result: ✅ Level 2 (Email OTP)
- Risk Factors: Device HIGH, others LOW
- Notes: OTP received in 5 seconds

[Continue for other scenarios...]
```

---

## 🚀 Advanced Testing

### **Test with Multiple Users:**
```javascript
// In browser console on reset-behaviors.html
const testEmails = ['user1@test.com', 'user2@test.com', 'user3@test.com'];

for (const email of testEmails) {
  // Clear client data
  localStorage.removeItem(`device_profile_${email}`);
  localStorage.removeItem(`behavior_baseline_${email}`);
  localStorage.removeItem(`time_profile_${email}`);
  localStorage.removeItem(`credential_profile_${email}`);
}

console.log('✅ Cleared data for all test users');
```

### **Simulate Full Risk Profile:**
```javascript
// In browser console on login page
AuthSimulator.runFullSimulation('test@example.com');
// Shows results for 6 different scenarios in console table
```

### **Check Current Profiles:**
```javascript
// In browser console
AuthSimulator.viewProfiles('test@example.com');
// Shows all stored risk data for user
```

### **Manual Device Registration:**
```javascript
// Force register current device
DeviceDebug.forceRegisterDevice('test@example.com');
```

---

## ✅ Testing Checklist

Before submitting for review, verify:

- [ ] Level 1 (Password-only) works for repeated logins
- [ ] Level 2 (OTP) triggers on new device
- [ ] Level 2 (OTP) triggers on failed attempts
- [ ] Level 3 (Face) triggers on high-risk scenarios
- [ ] Dynamic messages show correct risk factors
- [ ] OTP emails are received successfully
- [ ] Location detection shows city/country (not "Unknown")
- [ ] Face recognition works after enrollment
- [ ] Profile builds after 2-3 successful logins
- [ ] Reset tool clears all data successfully
- [ ] Works on Chrome, Firefox, and Edge browsers
- [ ] Works on mobile devices
- [ ] Server logs show detailed risk assessment
- [ ] No console errors during authentication flow

---

## 📞 Support

**Files to check if something breaks:**
- Frontend: `login-standalone-with-otp.html` (risk logic)
- Backend: `server/routes/auth.js` (authentication)
- Reset Tool: `reset-behaviors.html` (data clearing)

**Logs to examine:**
- Browser Console (F12)
- Server Terminal Output
- MongoDB Atlas Logs (if database issues)
- Brevo Email Logs (if OTP issues)

---

## 🎯 Success Criteria

Your risk-adaptive authentication is working correctly if:

1. ✅ Same device → Password-only (Level 1)
2. ✅ New device → Email OTP (Level 2)
3. ✅ Failed attempts → Email OTP (Level 2)
4. ✅ Multiple risks → Face Auth (Level 3)
5. ✅ Dynamic messages explain which factors triggered security
6. ✅ Location shows in email alerts
7. ✅ All privacy guarantees maintained (no data sent to server)

---

**Happy Testing! 🚀**
