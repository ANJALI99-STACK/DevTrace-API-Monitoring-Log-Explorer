import { Schema, model, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  _id: Types.ObjectId;
  endpointId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  isResolved: boolean;
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>({
  endpointId: { type: Schema.Types.ObjectId, ref: 'Endpoint', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  isResolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Alert = model<IAlert>('Alert', alertSchema);
