import express from "express";

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("USe an API shortener for your long URLs");
});

export default router;
