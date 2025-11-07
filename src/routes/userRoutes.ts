import express from 'express';
import { forgotPassword, signUp, signin } from '../controllers/authController';

const router = express.Router();

router.post('/signup', signUp);

router.post('/signin', signin);

router.post('/forgot-password', forgotPassword)

export default router;
