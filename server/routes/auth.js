const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const googleService = require('../services/googleService');
const zoomService = require('../services/zoomService');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/google', (req, res) => {
  const url = googleService.getAuthUrl();
  res.json({ url });
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await googleService.getTokensFromCode(code);
    const userInfo = await googleService.getUserInfo(tokens.access_token);

    let user = await User.findOne({ email: userInfo.email });

    if (user) {
      user.googleTokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      };
      await user.save();
    } else {
      user = await User.create({
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.picture,
        googleTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expiry_date),
        },
      });
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
});

router.get('/zoom', auth, (req, res) => {
  const url = zoomService.getAuthUrl();
  res.json({ url });
});

router.get('/zoom/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await zoomService.getTokensFromCode(code);

    const token = req.cookies.token;
    if (!token) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=not_authenticated`);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=user_not_found`);
    }

    user.zoomTokens = tokens;
    await user.save();

    res.redirect(`${process.env.CLIENT_URL}/settings?zoom=connected`);
  } catch (error) {
    console.error('Zoom auth error:', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=zoom_auth_failed`);
  }
});

router.get('/me', auth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      hasGoogle: !!req.user.googleTokens?.accessToken,
      hasZoom: !!req.user.zoomTokens?.accessToken,
    },
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
