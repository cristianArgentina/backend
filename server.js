import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: "https://cristianargentina.github.io", // tu frontend en GitHub Pages
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Rutas API
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);

// Ruta de prueba (root)
app.get("/", (req, res) => {
  res.send("Backend funcionando en Cyclic 🚀");
});

// Conexión a MongoDB y arranque del server
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
    });
  })
  .catch(err => console.error("❌ Error conectando a MongoDB:", err));
