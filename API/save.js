import { Client } from "pg";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nome } = req.body;

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      await client.query("CREATE TABLE IF NOT EXISTS usuarios (id SERIAL PRIMARY KEY, nome TEXT)");
      await client.query("INSERT INTO usuarios (nome) VALUES ($1)", [nome]);
      await client.end();
      res.status(200).json({ message: "Salvo com sucesso!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao salvar" });
    }
  } else {
    res.status(405).json({ error: "Método não permitido" });
  }
}