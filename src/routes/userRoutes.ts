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
import { restrictTo } from '../middlewares/restrictTo';
import { getAllUsers } from '../controllers/userController';
import { validate } from '../middlewares/validate';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  updateUserSchema,
} from '../validate/auth.schema';

const router = express.Router();

router.post('/signup', validate(signUpSchema), signUp);

router.post('/signin', validate(signInSchema), signin);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

router.patch(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  resetPassword
);

router.use(protect);

router.patch(
  '/update-password',
  validate(updatePasswordSchema),
  updatePassword
);

router.post('/logout', logout);

router.patch('/update-user', validate(updateUserSchema), updateUser);

router.get('/get-all-users', restrictTo('admin'), getAllUsers);

export default router;
