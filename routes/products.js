import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error al obtener productos", error });
  }
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

// Crear un nuevo producto
router.post("/", async (req, res) => {
  try {
    const nuevo = new Product({
      id: Date.now(), // 👈 id autogenerado con timestamp
      ...req.body
    });

    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    res.status(400).json({ error: err.message });
  }
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

// GET /products/:id/lotes
router.get("/:id/lotes", async (req, res) => {
  try {
    const producto = await Product.findOne({ id: req.params.id });
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    res.json(producto.lotes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener lotes" });
  }
});

// POST /products/:id/lotes
router.post("/:id/lotes", async (req, res) => {
  try {
    const producto = await Product.findOne({ id: req.params.id });
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    producto.lotes.push(req.body);
    producto.stock += req.body.cantidad; // actualizar stock total
    await producto.save();

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al agregar lote" });
  }
});

// DELETE /products/:id/lotes/:loteIndex
router.delete("/:id/lotes/:loteId", async (req, res) => {
  try {
    const { id, loteId } = req.params;

    // Buscar el producto
    const producto = await Product.findOne({ id });
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Buscar el lote por su _id
    const loteIndex = producto.lotes.findIndex(
      (lote) => lote._id.toString() === loteId
    );

    if (loteIndex === -1) {
      return res.status(404).json({ message: "Lote no encontrado" });
    }

    // Eliminar el lote y actualizar stock
    const loteEliminado = producto.lotes.splice(loteIndex, 1)[0];
    producto.stock -= loteEliminado.cantidad;

    await producto.save();

    res.json({
      message: "Lote eliminado correctamente",
      producto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar lote" });
  }
});


export default router;
