import { findUserById, verifyToken } from "../services/userService.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Nicht angemeldet." });
    return;
  }

  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub);
    const user = findUserById(userId);

    if (!user) {
      res.status(401).json({ message: "Benutzer nicht gefunden." });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Ungültiges Login." });
  }
}
