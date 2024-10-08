import mongoose, { Schema } from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CategoryModel = mongoose.model("Category", CategorySchema);
