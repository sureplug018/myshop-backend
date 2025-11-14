import express from 'express';
import {
  forgotPassword,
  logout,
  resetPassword,
  signUp,
  signin,
  updatePassword,
  updateUser,
} from '../controllers/authController';
import { protect } from '../middlewares/protectMiddleware';

const router = express.Router();

router.post('/signup', signUp);

router.post('/signin', signin);

router.post('/forgot-password', forgotPassword);

router.patch('/reset-password/:token', resetPassword);

router.use(protect);

router.patch('/update-password', updatePassword);

router.post('/logout', logout);

router.patch('/update-user', updateUser);

export default router;
