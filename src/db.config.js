import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: "myot-db.cfg8couqu8rm.ap-northeast-2.rds.amazonaws.com",
  user: "admin",
  password: "myot0703!",
  database: "myotdb",
  port: "3306",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool; 