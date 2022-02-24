import * as mongoose from 'mongoose';

export const BookMarkchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    link: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
