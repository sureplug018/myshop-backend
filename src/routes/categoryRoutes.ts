import express from 'express';
import {
  createCategory,
  editCategory,
} from '../controllers/categoryController';
import { protect } from '../middlewares/protectMiddleware';
import { restrictTo } from '../middlewares/restrictTo';
import { validate } from '../middlewares/validate';
import { createCategorySchema } from '../validate/category.schema';
const router = express.Router();

router.use(protect, restrictTo('admin'));
router.post('/create-category', validate(createCategorySchema), createCategory);
router.patch('/edit-category/:categoryId', editCategory);

export default router;
