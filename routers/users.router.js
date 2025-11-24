import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get My Info
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update My Info
router.patch('/me', authMiddleware, async (req, res) => {
    try {
        const { nickname, image } = req.body;
        const userId = req.user.id;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                nickname,
                image,
            },
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Change Password
router.patch('/me/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
            },
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get My Products
router.get('/me/products', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const products = await prisma.product.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get My Liked Products
router.get('/me/likes', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        // Using implicit many-to-many relation
        const userWithLikes = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                likedProducts: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        res.json(userWithLikes.likedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
