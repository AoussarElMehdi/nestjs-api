import { Document } from 'mongoose';

export interface BookMark extends Document {
  title: string;
  description?: string;
  link: string;
}