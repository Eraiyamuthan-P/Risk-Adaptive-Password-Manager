// client/src/pages/Login.tsx
// PRIVACY-PRESERVING, CLIENT-SIDE, RISK-ADAPTIVE AUTHENTICATION
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FaceAuth from '../components/FaceAuth';
import { BehavioralBiometrics, TypingSample } from '../utils/BehavioralBiometrics';
import { selectChallengeLevel, RiskAdaptiveAuth } from '../utils/RiskAdaptiveAuth';
import { explainAuthDecision, ExplainableAuth } from '../utils/ExplainableAuth';
import type { RiskAssessment, ChallengeLevel } from '../utils/RiskAdaptiveAuth';
import type { AuthExplanation } from '../utils/ExplainableAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Risk-adaptive authentication state
  const [challengeLevel, setChallengeLevel] = useState<ChallengeLevel | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [explanation, setExplanation] = useState<AuthExplanation | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Behavioral biometrics capture
  const biometricsRef = useRef(new BehavioralBiometrics());
  const typingSampleRef = useRef<TypingSample | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle password field focus - start behavioral biometric capture
   * PRIVACY: Only timing data captured, not actual keystrokes
   */
  const handlePasswordFocus = () => {
    biometricsRef.current.startCapture();
    console.log('[BiometricsCapture] Started capturing typing behavior');
  };

  /**
   * Handle password field key press
   * PRIVACY: Only records timestamps, not key values
   */
  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    const isBackspace = e.key === 'Backspace';
    biometricsRef.current.recordKeyPress(isBackspace);
  };

  /**
   * STEP 1: Calculate client-side risk and select challenge level
   * PRIVACY: All computation happens locally, no data sent to server yet
   */
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // SAVE EMAIL FOR FACE AUTH
    localStorage.setItem('loginEmail', email);

    try {
      // Stop biometric capture and get sample
      const sample = biometricsRef.current.stopCapture();
      typingSampleRef.current = sample;

      console.log('🔐 STEP 1: Calculating client-side risk...');
      
      // Calculate risk and select challenge level (CLIENT-SIDE ONLY)
      const { assessment, challengeLevel: selectedLevel } = await selectChallengeLevel(sample);
      
      setRiskAssessment(assessment);
      setChallengeLevel(selectedLevel);

      // Generate explanation (CLIENT-SIDE ONLY)
      const authExplanation = explainAuthDecision(assessment);
      setExplanation(authExplanation);
      setShowExplanation(true);

      console.log('✅ Risk assessment complete. Challenge Level:', selectedLevel);
      
      // Automatically proceed to authentication after showing explanation
      setLoading(false);
    } catch (err: any) {
      console.error('Risk assessment error:', err);
      setError('Security check failed. Please try again.');
      setLoading(false);
    }
  };

  /**
   * STEP 2: Perform authentication with selected challenge level
   * PRIVACY: Server receives ONLY challenge level, NOT risk factors
   */
  const handleAuthenticationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!challengeLevel) {
      setError('Security check incomplete. Please refresh and try again.');
      return;
    }

    setError('');
    setLoading(true);

    console.log('🔐 STEP 2: Authenticating with Challenge Level', challengeLevel);

    try {
      // Call login with challenge level and appropriate tokens
      let additionalToken: string | undefined;
      
      if (challengeLevel === 2) {
        // Email OTP required
        if (!emailOTP) {
          setError('Please enter the verification code sent to your email');
          setLoading(false);
          return;
        }
        additionalToken = emailOTP;
      } else if (challengeLevel === 4) {
        // TOTP required
        if (!twoFactorToken) {
          setError('Please enter your authenticator app code');
          setLoading(false);
          return;
        }
        additionalToken = twoFactorToken;
      }

      await login(email, masterPassword, challengeLevel, additionalToken);
      
      // Record successful authentication in all risk modules
      await RiskAdaptiveAuth.recordSuccessfulAuth(typingSampleRef.current);
      
      console.log('✅ Authentication successful - navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Authentication error:', err);
      
      // Record failed attempt
      RiskAdaptiveAuth.recordFailedAuth();
      
      if (err.requiresFaceAuth || challengeLevel === 3) {
        // Face auth required - will render FaceAuth component below
        console.log('👤 Face authentication required');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // RENDER FACE AUTH if challenge level 3 or 4
  if (challengeLevel === 3 || challengeLevel === 4) {
    console.log('Rendering FaceAuth component for Challenge Level', challengeLevel);
    return (
      <div>
        {explanation && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>{explanation.icon} {explanation.title}</strong>
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {explanation.reasons.join(' • ')}
            </p>
          </div>
        )}
        <FaceAuth 
          onSuccess={async () => {
            // After face auth, if Level 4, still need TOTP
            if (challengeLevel === 4) {
              setShowExplanation(false);
              // Will render TOTP input below
            } else {
              await RiskAdaptiveAuth.recordSuccessfulAuth(typingSampleRef.current);
              navigate('/dashboard');
            }
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg-neutral flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-block icon-bubble rounded-xl mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm">Sign in to access your vault</p>
        </div>

        {/* EXPLAINABLE AUTHENTICATION - Show risk explanation */}
        {showExplanation && explanation && (
          <div className={`mb-4 p-4 rounded-lg border animate-slide-down ${
            explanation.severity === 'critical' ? 'bg-red-50 border-red-200' :
            explanation.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start">
              <span className="text-2xl mr-3">{explanation.icon}</span>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  explanation.severity === 'critical' ? 'text-red-800' :
                  explanation.severity === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {explanation.title}
                </h3>
                <ul className={`text-sm space-y-1 mb-2 ${
                  explanation.severity === 'critical' ? 'text-red-700' :
                  explanation.severity === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {explanation.reasons.map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
                <p className={`text-sm font-medium ${
                  explanation.severity === 'critical' ? 'text-red-800' :
                  explanation.severity === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {explanation.recommendation}
                </p>
                {riskAssessment && (
                  <p className="text-xs mt-2 opacity-75">
                    {ExplainableAuth.getEducationalTip(riskAssessment.challengeLevel)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 animate-slide-down">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* STEP 1: Initial login form (before risk assessment) */}
        {!challengeLevel && (
          <form onSubmit={handleInitialSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Master Password</label>
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onFocus={handlePasswordFocus}
                onKeyDown={handlePasswordKeyDown}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                🔒 Your typing pattern helps verify your identity
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-base btn-primary disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Security...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Continue Securely
                </span>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Authentication form (after risk assessment) */}
        {challengeLevel && challengeLevel !== 3 && challengeLevel !== 4 && (
          <form onSubmit={handleAuthenticationSubmit} className="space-y-6">
            {challengeLevel === 2 && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email Verification Code</label>
                <input
                  type="text"
                  value={emailOTP}
                  onChange={(e) => setEmailOTP(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code sent to {email}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-base btn-primary disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setChallengeLevel(null);
                setShowExplanation(false);
                setError('');
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              ← Start Over
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;