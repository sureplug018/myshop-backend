import express from 'express';
import {
  createCategory,
  editCategory,
} from '../controllers/categoryController';
import { protect } from '../middlewares/protectMiddleware';
import { restrictTo } from '../middlewares/restrictTo';
const router = express.Router();

router.use(protect, restrictTo('admin'));
router.post('/create-category', createCategory);
router.patch('/edit-category/:categoryId', editCategory);

export default router;
