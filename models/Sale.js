import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  productId: { type: Number, required: true },   // ID del producto vendido
  cantidad: { type: Number, required: true },    // unidades vendidas
  precioVenta: { type: Number, required: true }, // precio unitario al que se concretó la venta
  precioCosto: { type: Number, required: true }, // costo promedio ponderado de esa venta
  ganancia: { type: Number, required: true },    // ganancia total de esa transacción
  fecha: { type: Date, default: Date.now }       // fecha de la venta
}, { timestamps: true }); // timestamps añade createdAt y updatedAt automáticamente

export default mongoose.model("Sale", saleSchema);
