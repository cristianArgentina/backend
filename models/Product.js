import mongoose from "mongoose";

const lotSchema = new mongoose.Schema({
  cantidad: { type: Number, required: true }, // unidades en el lote
  costoUnitario: { type: Number, default: null }, // precio de costo
  fechaIngreso: { type: Date, default: Date.now } // fecha de compra
});

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, default: "" },
  price: { type: Number, required: true }, // precio de venta
  image: { type: String, default: null }, // permite null si no hay imagen
  videos: { type: [String], default: [] }, // IDs de YouTube
  stock: { type: Number, required: true },
  lotes: { type: [lotSchema], default: [] }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
