import e, { Router } from "express";
import { login, register } from "../controllers/user.controller.js";

const router = Router();
router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post((req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

router.route("/get_all_activity").get((req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

export default router;
