import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: "https://cristianargentina.github.io", // tu frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Rutas
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB Atlas");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Servidor escuchando en puerto ${process.env.PORT}`);
    });
  })
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));
