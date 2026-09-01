import { Schema, model, Document, Types } from 'mongoose';

export interface IHealthLog extends Document {
  _id: Types.ObjectId;
  endpointId: Types.ObjectId;
  userId: Types.ObjectId;
  statusCode: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  checkedAt: Date;
}

const healthLogSchema = new Schema<IHealthLog>({
  endpointId: { type: Schema.Types.ObjectId, ref: 'Endpoint', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  statusCode: { type: Number, required: true },
  responseTime: { type: Number, required: true },
  success: { type: Boolean, required: true },
  errorMessage: { type: String },
  checkedAt: { type: Date, default: Date.now, index: true },
});

export const HealthLog = model<IHealthLog>('HealthLog', healthLogSchema);
