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
import { validate } from '../middlewares/validate';
import {
  createProductSchema,
  deleteProductSchema,
  getProductByIdSchema,
  updateProductSchema,
} from '../validate/product.schema';

const router = express.Router();

router.get('/', getAllProducts);

router.get('/:id', validate(getProductByIdSchema), getProductById);

router.post(
  '/create-product',
  protect,
  restrictTo('admin'),
  validate(createProductSchema),
  createProduct
);

router.patch(
  '/update-product/:id',
  protect,
  restrictTo('admin'),
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  '/delete-product/:id',
  protect,
  restrictTo('admin'),
  validate(deleteProductSchema),
  deleteProduct
);

export default router;
