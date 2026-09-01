import { Schema, model, Document, Types } from 'mongoose';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface IEndpoint extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatus: number;
  interval: number; // seconds
  isActive: boolean;
  consecutiveFailures: number;
  lastCheckedAt: Date | null;
  createdAt: Date;
}

const endpointSchema = new Schema<IEndpoint>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
  expectedStatus: { type: Number, default: 200 },
  interval: { type: Number, default: 60 },
  isActive: { type: Boolean, default: true },
  consecutiveFailures: { type: Number, default: 0 },
  lastCheckedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const Endpoint = model<IEndpoint>('Endpoint', endpointSchema);
