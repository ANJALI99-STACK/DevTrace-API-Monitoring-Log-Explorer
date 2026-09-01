import { Response } from 'express';
import { Types } from 'mongoose';
import { Endpoint } from '../models/Endpoint';
import { Alert } from '../models/Alert';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';

export const listAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const alerts = await Alert.find({ userId: req.userId }).sort({ createdAt: -1 }).populate('endpointId', 'name url');
  res.json({ success: true, data: alerts });
});

export const resolveAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { isResolved: true },
    { new: true }
  );
  if (!alert) throw new ApiError(404, 'Alert not found');
  res.json({ success: true, data: alert });
});
