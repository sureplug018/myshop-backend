import express from 'express';
import {
  createShippingAddress,
  deleteShippingAddress,
  getAllShippingAddresses,
  getUserShippingAddress,
  updateShippingAddress,
} from '../controllers/shippingController';
import { protect } from '../middlewares/protectMiddleware';
import { restrictTo } from '../middlewares/restrictTo';
import { validate } from '../middlewares/validate';
import {
  createShippingAddressSchema,
  updateShippingAddressSchema,
} from '../validate/shipping.schema';

const router = express.Router();

router.use(protect);

router.get('/get-user-address', getUserShippingAddress);

router.post(
  '/create-shipping-address',
  validate(createShippingAddressSchema),
  createShippingAddress
);

router.patch(
  '/update-shipping-address/:id',
  validate(updateShippingAddressSchema),
  updateShippingAddress
);

router.use(restrictTo('admin'));

router.get('/', getAllShippingAddresses);

router.delete('/delete-shipping-address/:id', deleteShippingAddress);

export default router;
