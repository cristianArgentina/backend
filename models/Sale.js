import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  productId: Number,
  cantidad: Number,
  precioVenta: Number,
  precioCosto: Number,
  ganancia: Number,
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Sale", saleSchema);
