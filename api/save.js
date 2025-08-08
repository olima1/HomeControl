import { Client } from "pg";

export default async function handler(req, res) {
  console.log("Requisição recebida na API /api/save");
  console.log("Método da requisição:", req.method);

  if (req.method === "POST") {
    console.log("Método POST detectado.");
    const { nome } = req.body;
    console.log("Nome recebido no corpo:", nome);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log("Conectado ao banco de dados.");
      await client.query("CREATE TABLE IF NOT EXISTS usuarios (id SERIAL PRIMARY KEY, nome TEXT)");
      console.log("Tabela 'usuarios' verificada/criada.");
      await client.query("INSERT INTO usuarios (nome) VALUES ($1)", [nome]);
      console.log("Usuário inserido com sucesso!");
      await client.end();
      res.status(200).json({ message: "Salvo com sucesso!" });
    } catch (err) {
      console.error("Erro ao processar a requisição:", err);
      res.status(500).json({ error: "Erro ao salvar" });
    }
  } else {
    console.log("Método não permitido detectado:", req.method);
    res.status(405).json({ error: "Método não permitido" });
  }
}