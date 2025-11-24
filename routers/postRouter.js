import express from 'express';
import prisma from '../lib/prisma.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.post('/posts', authenticate, createPost);
router.get('/posts', getPosts);
router.put('/posts/:id', authenticate, updatePost);
router.delete('/posts/:id', authenticate, deletePost);

async function createPost(req, res) {
  const { content } = req.body;
  const user = req.user;

  const post = await prisma.post.create({
    data: { content, authorId: user.id },
  });

  res.status(201).json(post);
}

async function getPosts(req, res) {
  const posts = await prisma.post.findMany();
  res.json(posts);
}

async function updatePost(req, res) {
  const { id } = req.params;
  const { content } = req.body;
  const user = req.user;

  const post = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.authorId !== user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const updatedPost = await prisma.post.update({
    where: { id: Number(id) },
    data: { content },
  });

  res.json(updatedPost);
}

async function deletePost(req, res) {
  const { id } = req.params;
  const user = req.user;

  const post = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.authorId !== user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await prisma.post.delete({
    where: { id: Number(id) },
  });

  res.status(204).send();
}

export default router;
