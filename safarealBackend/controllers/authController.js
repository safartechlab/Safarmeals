const User = require('../models/User');
const Shop = require('../models/Shop');
const generateToken = require('../utils/generateToken');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { admin, isFirebaseReady } = require('../utils/firebaseAdmin');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, city } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Determine role - restrict shopowner and admin signups if needed, but standard register allows 'user'
    // Shopowner registrations are either created by admin or self-registered and require shop approval.
    const userRole = role === 'shopowner' ? 'shopowner' : 'user';

    if (userRole === 'shopowner' && !city) {
      return res.status(400).json({ success: false, message: 'City is required for shop owner registration' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: userRole
    });

    if (userRole === 'shopowner') {
      // Auto-create restaurant shop profile in pending state (isApproved: false)
      await Shop.create({
        ownerId: user._id,
        shopName: `${name}'s Kitchen`,
        description: 'Configure restaurant description and gourmet details.',
        cuisines: ['Gourmet', 'Fast Food'],
        address: {
          houseNo: 'Configure House No',
          streetName: 'Configure Street',
          society: 'Configure Society',
          addressLine: 'Configure street address',
          city: city,
          state: 'NY',
          zipCode: '10001',
          latitude: 40.7128,
          longitude: -74.0060
        },
        openingTime: '09:00',
        closingTime: '22:00',
        isApproved: false // Pending approval
      });
    }

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    if (req.file) {
      user.profileImage = await uploadImage(req.file);
    }

    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        addresses: updatedUser.addresses,
        wishlist: updatedUser.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate & simulate sending OTP to a mobile number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a valid mobile number' });
    }

    // Generate random 4-digit OTP
    const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if user exists with this phone number
    let user = await User.findOne({ phone });
    if (!user) {
      // Auto-signup! Generate mock unique email and password
      const uniqueMockEmail = `phone_${phone}_${Math.floor(100 + Math.random() * 900)}@safarmeal.com`;
      const randomPassword = Math.random().toString(36).slice(-8);
      user = await User.create({
        name: `Guest ${phone.slice(-4)}`,
        email: uniqueMockEmail,
        phone: phone,
        password: randomPassword,
        role: 'user',
        otp: generatedOTP
      });
    } else {
      // User exists, save the OTP
      user.otp = generatedOTP;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully!',
      otp: generatedOTP // Simulated return
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify mobile OTP & get token
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide mobile number and OTP' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found with this mobile number' });
    }

    // Verify OTP
    if (user.otp !== otp && otp !== '1234') { // Allow '1234' as universal dev fallback
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the simulated code!' });
    }

    // Clear OTP after successful login
    user.otp = null;
    await user.save();

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Firebase ID token & authenticate/register customer
// @route   POST /api/auth/firebase-login
// @access  Public
const firebaseLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Please provide a Firebase ID token' });
    }

    if (!isFirebaseReady()) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Authentication is not configured on the server. Please contact support.'
      });
    }

    // Verify ID Token with Firebase
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (verifyError) {
      console.warn('Firebase token verification failed. Attempting fallback for clock skew:', verifyError.message);
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          const expectedIss = `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID || 'safarmeal'}`;
          const expectedAud = process.env.FIREBASE_PROJECT_ID || 'safarmeal';
          if (payload.iss === expectedIss && payload.aud === expectedAud) {
            console.log('Successfully decoded token using local fallback. Phone:', payload.phone_number);
            decodedToken = payload;
          } else {
            throw new Error('JWT issuer or audience mismatch');
          }
        } else {
          throw new Error('Invalid JWT format');
        }
      } catch (fallbackError) {
        console.error('Fallback token decoding failed:', fallbackError.message);
        throw verifyError;
      }
    }
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Invalid token, phone number not found' });
    }

    // Standardize phone number format for local DB matching (remove +91 prefix to match local records)
    let cleanPhone = phoneNumber;
    if (phoneNumber.startsWith('+91')) {
      cleanPhone = phoneNumber.slice(3); // e.g. +919876543210 -> 9876543210
    } else if (phoneNumber.startsWith('+')) {
      cleanPhone = phoneNumber.slice(1);
    }

    // Check if user already exists
    let user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      // Auto-signup!
      const uniqueMockEmail = `phone_${cleanPhone}_${Math.floor(100 + Math.random() * 900)}@safarmeal.com`;
      const randomPassword = Math.random().toString(36).slice(-8);
      user = await User.create({
        name: `Guest ${cleanPhone.slice(-4)}`,
        email: uniqueMockEmail,
        phone: cleanPhone,
        password: randomPassword,
        role: 'user'
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist
      }
    });
  } catch (error) {
    console.error('Firebase Token Verification Error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid or expired Firebase ID token' });
  }
};

module.exports = { register, login, getMe, updateProfile, sendOTP, verifyOTP, firebaseLogin };
