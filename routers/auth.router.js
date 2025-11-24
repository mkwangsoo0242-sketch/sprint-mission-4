import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { generateTokens, verifyRefreshToken } from '../lib/token.js';
import {
    ACCESS_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME,
} from '../lib/constants.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, nickname, password, image } = req.body;

        if (!email || !nickname || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                nickname,
                password: hashedPassword,
                image,
            },
        });

        // Don't return password
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
            },
        });

        res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, { httpOnly: true });
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, { httpOnly: true });

        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const { userId } = verifyRefreshToken(refreshToken);

        // Check if refresh token exists in DB
        const savedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!savedToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);

        // Rotate refresh token (delete old, create new)
        // Transaction to ensure atomicity
        await prisma.$transaction([
            prisma.refreshToken.delete({ where: { token: refreshToken } }),
            prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId,
                },
            }),
        ]);

        res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, { httpOnly: true });
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, { httpOnly: true });

        res.json({ message: 'Token refreshed' });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
        if (refreshToken) {
            await prisma.refreshToken.delete({ where: { token: refreshToken } }).catch(() => { });
        }

        res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
