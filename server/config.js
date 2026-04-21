import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET,
  sqliteDbPath: process.env.SQLITE_DB_PATH || "./server/data/app.sqlite",
  corsOrigin: process.env.CORS_ORIGIN || "",
};

if (!config.jwtSecret) {
  throw new Error("JWT_SECRET fehlt. Bitte .env aus .env.example erstellen.");
}
