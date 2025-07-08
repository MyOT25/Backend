import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "myot-db.cfg8couqu8rm.ap-northeast-2.rds.amazonaws.com",
  user: "admin",
  password: "myot0703!",
  database: "myot",
  waitForConnections: true,
  connectionLimit: 10,
});
