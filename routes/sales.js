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

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const {
      productId,
      cantidad,
      precioVenta
    } = req.body;

    const producto =
      await Product.findOne({ id: productId })
        .session(session);

    if (!producto)
      throw new Error("Producto no encontrado");

    let precioCostoTotal = 0;
    let items = [];

    /* ===================================================== */
    /* 🧠 FUNCION FIFO (REUTILIZABLE) */
    /* ===================================================== */

    const consumirFIFO = async (productoDB, cantidadNecesaria) => {

      let restante = cantidadNecesaria;

      while (restante > 0 && productoDB.lotes.length > 0) {

        const lote = productoDB.lotes[0];

        const usado =
          Math.min(lote.cantidad, restante);

        restante -= usado;
        lote.cantidad -= usado;

        /* registrar consumo REAL */

        items.push({
          productId: productoDB.id,
          cantidad: usado,
          costoUnitario: lote.costoUnitario
        });

        precioCostoTotal +=
          usado * lote.costoUnitario;

        if (lote.cantidad === 0)
          productoDB.lotes.shift();

      }

      if (restante > 0) {
        throw new Error(
          `Stock insuficiente para ${productoDB.name}`
        );
      }

      productoDB.stock -= cantidadNecesaria;

      await productoDB.save({ session });

    };

    /* ===================================================== */
    /* 🧠 SI ES COMBO */
    /* ===================================================== */

    if (producto.isCombo) {

      for (const item of producto.combo) {

        const productoInterno =
          await Product.findOne({
            id: item.productId
          }).session(session);

        if (!productoInterno)
          throw new Error(
            `Producto interno ${item.productId} no encontrado`
          );

        const cantidadNecesaria =
          item.qty * cantidad;

        await consumirFIFO(
          productoInterno,
          cantidadNecesaria
        );

      }

    }

    /* ===================================================== */
    /* 📦 PRODUCTO SIMPLE */
    /* ===================================================== */

    else {

      await consumirFIFO(
        producto,
        cantidad
      );

    }

    /* ===================================================== */
    /* 💰 CALCULOS */
    /* ===================================================== */

    const gananciaTotal =
      (precioVenta * cantidad) -
      precioCostoTotal;

    /* ===================================================== */
    /* 🧾 CREAR VENTA */
    /* ===================================================== */

    const venta =
      new Sale({

        productId,
        cantidad,
        precioVenta,

        precioCosto:
          precioCostoTotal / cantidad,

        ganancia:
          gananciaTotal,

        items, // 🔥 CLAVE

        fecha:
          new Date()

      });

    await venta.save({ session });

    /* ===================================================== */
    /* ✅ COMMIT */
    /* ===================================================== */

    await session.commitTransaction();

    res.json({
      message: "Venta registrada",
      venta
    });

  }

  catch (err) {

    await session.abortTransaction();

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

  finally {

    session.endSession();

  }

});

// Eliminar venta
router.delete("/:id", async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const venta = await Sale.findById(req.params.id)
      .session(session);

    if (!venta)
      throw new Error("Venta no encontrada");

    /* ===================================================== */
    /* 🔁 REVERTIR STOCK DESDE ITEMS */
    /* ===================================================== */

    for (const item of venta.items) {

      const producto = await Product.findOne({
        id: item.productId
      }).session(session);

      if (!producto)
        throw new Error(
          `Producto ${item.productId} no encontrado`
        );

      /* devolver stock */

      producto.stock += item.cantidad;

      /* recrear lote EXACTO */

      producto.lotes.push({
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
        fechaIngreso: new Date() // opcional
      });

      await producto.save({ session });

    }

    /* ===================================================== */
    /* 🗑 ELIMINAR VENTA */
    /* ===================================================== */

    await venta.deleteOne({ session });

    /* ===================================================== */
    /* ✅ COMMIT */
    /* ===================================================== */

    await session.commitTransaction();

    res.json({
      message: "Venta eliminada correctamente (reversión exacta)"
    });

  }

  catch (err) {

    await session.abortTransaction();

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

  finally {

    session.endSession();

  }

});

// Obtener todas las ventas
router.get("/", async (req, res) => {
  const ventas = await Sale.find();
  res.json(ventas);
});

export default router;
