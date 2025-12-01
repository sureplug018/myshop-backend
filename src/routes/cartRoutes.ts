import express from 'express';
import {
  getUserCart,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from '../controllers/cartController';
import { protect } from '../middlewares/protectMiddleware';
import { validate } from '../middlewares/validate';
import { addToCartSchema } from '../validate/cart.schema';

const router = express.Router();

router.use(protect);

router.get('/get-user-cart', getUserCart);
router.post('/add-item-to-cart', validate(addToCartSchema), addItemToCart);
router.patch('/remove-item-from-cart/:itemId', removeItemFromCart);
router.patch('/update-item-quantity/:itemId', updateCartItemQuantity);

export default router;
