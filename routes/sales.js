import express from "express";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import mongoose from "mongoose";

const router = express.Router();

async function validarStockFIFO(producto, cantidad) {

  let disponible = 0;

  if (!producto.lotes)
    return false;

  for (const lote of producto.lotes) {

    disponible += lote.cantidad;

    if (disponible >= cantidad)
      return true;

  }

  return false;

}
// Registrar venta (FIFO)
router.post("/", async (req, res) => {

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    const {
      productId,
      cantidad,
      precioVenta
    } = req.body;

    const producto =
      await Product.findOne({
        id: productId
      }).session(session);

    if (!producto)
      throw new Error(
        "Producto no encontrado"
      );

    let precioCostoTotal = 0;
    let gananciaTotal = 0;

    /* =============================== */
    /* 🧠 SI ES COMBO */
    /* =============================== */

    if (producto.isCombo) {

      /* VALIDAR STOCK */

      for (const item of producto.combo) {

        const interno =
          await Product.findOne({
            id: item.productId
          }).session(session);

        if (!interno)
          throw new Error(
            "Producto interno no encontrado"
          );

        let disponible =
          interno.lotes.reduce(
            (acc, l) =>
              acc + l.cantidad,
            0
          );

        const necesario =
          item.qty * cantidad;

        if (disponible < necesario)
          throw new Error(
            `Stock insuficiente para ${interno.name}`
          );

      }

      /* CONSUMIR FIFO */

      for (const item of producto.combo) {

        const interno =
          await Product.findOne({
            id: item.productId
          }).session(session);

        let restante =
          item.qty * cantidad;

        while (
          restante > 0 &&
          interno.lotes.length > 0
        ) {

          const lote =
            interno.lotes[0];

          const usado =
            Math.min(
              lote.cantidad,
              restante
            );

          restante -= usado;
          lote.cantidad -= usado;

          precioCostoTotal +=
            usado * lote.costoUnitario;

          if (lote.cantidad === 0)
            interno.lotes.shift();

        }

        interno.stock -=
          item.qty * cantidad;

        await interno.save({
          session
        });

      }

      const costoPromedio =
        precioCostoTotal / cantidad;

      gananciaTotal =
        (precioVenta * cantidad)
        - precioCostoTotal;

    }

    /* =============================== */
    /* 📦 PRODUCTO NORMAL */
    /* =============================== */

    else {

      let restante = cantidad;

      let disponible =
        producto.lotes.reduce(
          (acc, l) =>
            acc + l.cantidad,
          0
        );

      if (disponible < cantidad)
        throw new Error(
          "Stock insuficiente"
        );

      while (
        restante > 0 &&
        producto.lotes.length > 0
      ) {

        const lote =
          producto.lotes[0];

        const usado =
          Math.min(
            lote.cantidad,
            restante
          );

        restante -= usado;
        lote.cantidad -= usado;

        precioCostoTotal +=
          usado * lote.costoUnitario;

        gananciaTotal +=
          usado * (
            precioVenta
            - lote.costoUnitario
          );

        if (lote.cantidad === 0)
          producto.lotes.shift();

      }

      producto.stock -= cantidad;

      await producto.save({
        session
      });

    }

    /* =============================== */
    /* REGISTRAR VENTA */
    /* =============================== */

    const venta =
      new Sale({

        productId,
        cantidad,
        precioVenta,

        precioCosto:
          precioCostoTotal /
          cantidad,

        ganancia:
          gananciaTotal,

        fecha:
          new Date()

      });

    await venta.save({
      session
    });

    await session.commitTransaction();

    session.endSession();

    res.json({

      message:
        "Venta registrada correctamente",

      venta

    });

  }

  catch (err) {

    await session.abortTransaction();

    session.endSession();

    console.error(err);

    res.status(400).json({

      error: err.message

    });

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
