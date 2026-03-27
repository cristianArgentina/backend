import express from "express";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";

const router = express.Router();

// Registrar venta (FIFO)
router.post("/", async (req, res) => {
    try {
  const { productId, cantidad, precioVenta } = req.body;

  const producto = await Product.findOne({ id: productId });
  if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

  let cantidadRestante = cantidad;
  let gananciaTotal = 0;
  let precioCostoTotal = 0;

  // FIFO: consumir lotes antiguos primero
  while (cantidadRestante > 0 && producto.lotes.length > 0) {
    const lote = producto.lotes[0];
    const usado = Math.min(lote.cantidad, cantidadRestante);
    cantidadRestante -= usado;
    lote.cantidad -= usado;

    precioCostoTotal += usado * lote.costoUnitario;
    gananciaTotal += usado * (precioVenta - lote.costoUnitario);

    if (lote.cantidad === 0) {
      producto.lotes.shift();
    }
  }

  producto.stock -= cantidad;
  await producto.save();

  const venta = new Sale({
    productId,
    cantidad,
    precioVenta,
    precioCosto: precioCostoTotal / cantidad,
    ganancia: gananciaTotal,
    fecha: new Date() 
  });
  await venta.save();

    res.json({ message: "Venta registrada", venta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar venta" });
  }
});

// Eliminar venta
router.delete("/:id", async (req, res) => {
  try {
    const venta = await Sale.findById(req.params.id);
    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const producto = await Product.findOne({ id: venta.productId });
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // 🔁 Devolver stock
    producto.stock += venta.cantidad;

    // ⚠️ Opcional: agregar como lote nuevo (no FIFO real)
    producto.lotes.push({
      cantidad: venta.cantidad,
      costoUnitario: venta.precioCosto
    });

    await producto.save();

    await venta.deleteOne();

    res.json({ message: "Venta eliminada y stock restaurado" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar venta" });
  }
});

// Obtener todas las ventas
router.get("/", async (req, res) => {
  const ventas = await Sale.find();
  res.json(ventas);
});

export default router;
