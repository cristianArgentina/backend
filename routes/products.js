import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// Obtener todos los productos
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Obtener un producto por ID
router.get("/:id", async (req, res) => {
  try {
    const producto = await Product.findOne({ id: req.params.id });
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener producto", error });
  }
});

// Agregar un producto
router.post("/", async (req, res) => {
  const nuevo = new Product(req.body);
  await nuevo.save();
  res.json(nuevo);
});

// Actualizar un producto
router.put("/:id", async (req, res) => {
  const producto = await Product.findOneAndUpdate(
    { id: req.params.id },
    req.body,
    { new: true }
  );
  res.json(producto);
});

// Eliminar un producto
router.delete("/:id", async (req, res) => {
  await Product.findOneAndDelete({ id: req.params.id });
  res.json({ message: "Producto eliminado" });
});

export default router;
