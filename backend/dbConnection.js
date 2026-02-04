import pg from "pg";
import dotenv from "dotenv";

dotenv.config()

const client = new pg.Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

const connection = await client.connect();

export default client;
