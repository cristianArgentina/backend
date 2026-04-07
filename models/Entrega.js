import mongoose from "mongoose";

const entregaSchema = new mongoose.Schema({

  contacto: String,
  lugares: String,
  fechaTexto: String,
  horaTexto: String,
  fecha: Date,
  hora: String,
  productos: String,
  canal: String,
  estado: {
    type: String,
    default: "pending"
  }

}, {
  timestamps: true
});

export default mongoose.model(
  "Entrega",
  entregaSchema
);