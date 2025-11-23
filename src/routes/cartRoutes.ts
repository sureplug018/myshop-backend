import express from 'express';
import {
  getUserCart,
  addItemToCart,
  removeItemFromCart,
} from '../controllers/cartController';
import { protect } from '../middlewares/protectMiddleware';

const router = express.Router();

router.use(protect);

router.get('/get-user-cart', getUserCart);
router.post('/add-item-to-cart', addItemToCart);
router.patch('/remove-item-from-cart/:itemId', removeItemFromCart);
router.patch('/update-item-quantity/:itemId', removeItemFromCart);

export default router;
