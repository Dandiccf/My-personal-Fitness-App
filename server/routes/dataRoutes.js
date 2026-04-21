import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getUserData, resetUserData, saveUserData } from "../services/userDataService.js";

const router = Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  res.json(getUserData(req.user.id));
});

router.put("/", (req, res) => {
  res.json(saveUserData(req.user.id, req.body));
});

router.delete("/", (req, res) => {
  resetUserData(req.user.id);
  res.sendStatus(204);
});

export default router;
