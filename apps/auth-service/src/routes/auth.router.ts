import express, { Router } from 'express';
import {
  getUser,
  login,
  refreshToken,
  resetUserPassword,
  userForgotPassword,
  userRegistration,
  verifyUser,
  veryfyUserForgotPassword,
} from '../controller/auth.controller';
import isAuthenticated from '@packages/middleware/isAuthenticated';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-user', verifyUser);
router.post('/login-user', login);
router.post('/refresh-tocken-user', refreshToken);
router.get('/logged-in-user', isAuthenticated, getUser);
router.post('/forgot-password-user', userForgotPassword);
router.post('/verify-forgot-password-user', veryfyUserForgotPassword);
router.post('/reset-password-user', resetUserPassword);

export default router;
