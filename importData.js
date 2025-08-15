import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import fs from "fs";

dotenv.config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch(err => {
    console.error("❌ Error de conexión:", err);
    process.exit(1);
  });

// Leer el archivo JSON
const products = JSON.parse(fs.readFileSync("./productos_nuevo.json", "utf-8"));

// Importar datos
const importData = async () => {
  try {
    await Product.deleteMany(); // Opcional: Limpia la colección antes
    await Product.insertMany(products);
    console.log("✅ Datos importados correctamente");
    process.exit();
  } catch (err) {
    console.error("❌ Error importando datos:", err);
    process.exit(1);
  }
};

importData();
