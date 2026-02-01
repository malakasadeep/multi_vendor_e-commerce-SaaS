import express, { Router } from 'express';
import {
  login,
  resetUserPassword,
  userForgotPassword,
  userRegistration,
  verifyUser,
  veryfyUserForgotPassword,
} from '../controller/auth.controller';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-user', verifyUser);
router.post('/login-user', login);
router.post('/forgot-password-user', userForgotPassword);
router.post('/verify-forgot-password-user', veryfyUserForgotPassword);
router.post('/reset-password-user', resetUserPassword);

export default router;
