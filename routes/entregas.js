import express from "express";
import Entrega from "../models/Entrega.js";

const router = express.Router();

/* GET todas */

router.get("/", async (req, res) => {

  const entregas =
    await Entrega.find()
      .sort({ createdAt: -1 });

  res.json(entregas);

});

/* POST */

router.post("/", async (req, res) => {

  const nueva =
    new Entrega(req.body);

  await nueva.save();

  res.json(nueva);

});

/* PUT */

router.put("/:id", async (req, res) => {

  const updated =
    await Entrega.findByIdAndUpdate(

      req.params.id,
      req.body,
      { new: true }

    );

  res.json(updated);

});

/* DELETE */

router.delete("/:id", async (req, res) => {

  await Entrega.findByIdAndDelete(
    req.params.id
  );

  res.json({ ok: true });

});

export default router;