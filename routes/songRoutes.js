import express from 'express';
const router = express.Router();
import { submitRequest, getRequests, cleanup } from '../controllers/songController.js';
import authMiddleware  from'../middleware/authMiddleware.js';

router.post('/request', submitRequest);       // Public
router.get('/requests', getRequests);         // Public or optional auth
router.delete('/cleanup', authMiddleware, cleanup); // Only DJ

export default router;
