import express from 'express';
import { protect } from '../middlewares/protectMiddleware';
import { restrictTo } from '../middlewares/restrictTo';
import { validate } from '../middlewares/validate';
import {
  getOrderDetailsSchema,
  placeOrderSchema,
  updateOrderStatusSchema,
} from '../validate/order.schema';
import {
  getAllOrders,
  getOrderDetails,
  getUserOrders,
  placeOrder,
  updateOrderStatus,
} from '../controllers/orderController';

const router = express.Router();

router.post(
  '/place-order/:cartId',
  protect,
  restrictTo('user'),
  validate(placeOrderSchema),
  placeOrder
);

router.get(
  '/get-order-details/:orderId',
  protect,
  validate(getOrderDetailsSchema),
  getOrderDetails
);

router.get('/admin/get-all-orders', protect, restrictTo('admin'), getAllOrders);

router.get('/get-user-orders', protect, getUserOrders);

router.patch(
  '/update-order-status/orderId',
  protect,
  restrictTo('admin'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
