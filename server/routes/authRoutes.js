import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createToken,
  createUser,
  findUserRowByEmail,
  isValidEmail,
  normalizeEmail,
  rowToUser,
  verifyPassword,
} from "../services/userService.js";
import { ensureUserData } from "../services/userDataService.js";

const router = Router();

router.post("/register", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!isValidEmail(email)) {
    res.status(400).json({ message: "Bitte eine gültige E-Mail angeben." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Das Passwort muss mindestens 8 Zeichen haben." });
    return;
  }

  const existing = findUserRowByEmail(email);
  if (existing) {
    res.status(409).json({ message: "Die E-Mail ist bereits registriert." });
    return;
  }

  const user = await createUser(email, password);
  ensureUserData(user.id);
  res.status(201).json({ token: createToken(user), user });
});

router.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const userRow = findUserRowByEmail(email);

  if (!userRow) {
    res.status(401).json({ message: "E-Mail oder Passwort ist falsch." });
    return;
  }

  const passwordMatches = await verifyPassword(password, userRow.password_hash);
  if (!passwordMatches) {
    res.status(401).json({ message: "E-Mail oder Passwort ist falsch." });
    return;
  }

  const user = rowToUser(userRow);
  ensureUserData(user.id);
  res.json({ token: createToken(user), user });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
