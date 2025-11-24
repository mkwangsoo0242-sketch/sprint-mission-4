import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routers/auth.router.js';
import usersRouter from './routers/users.router.js';
import productsRouter from './routers/products.router.js';
import articlesRouter from './routers/articles.router.js';
import commentsRouter from './routers/comments.router.js';
import { PORT } from './lib/constants.js';

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/articles', articlesRouter);
app.use('/comments', commentsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
