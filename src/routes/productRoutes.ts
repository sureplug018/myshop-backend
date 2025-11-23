import express from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from '../controllers/productController';
import { protect } from '../middlewares/protectMiddleware';
import { restrictTo } from '../middlewares/restrictTo';

const router = express.Router();

router.get('/', getAllProducts);

router.get('/:id', getProductById);

router.post('/create-product', protect, restrictTo('admin'), createProduct);

router.patch(
  '/update-product/:id',
  protect,
  restrictTo('admin'),
  updateProduct
);

router.delete(
  '/delete-product/:id',
  protect,
  restrictTo('admin'),
  deleteProduct
);

export default router;
