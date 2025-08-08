import { Client } from "pg";

// Função para validar se o número é um número válido.
// Se precisar de uma validação mais robusta (e.g., regex para telefone), você pode adaptar aqui.
function isNumber(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

export default async function handler(req, res) {
  // Apenas aceita requisições POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Desestruturar os dados do corpo da requisição
  const { nome, numero } = req.body;

  // Validação básica dos dados recebidos
  if (!nome || !numero) {
    return res.status(400).json({ error: "Nome e número são campos obrigatórios." });
  }

  if (!isNumber(numero)) {
    return res.status(400).json({ error: "O campo 'numero' deve ser um número." });
  }

  // Configuração do cliente do PostgreSQL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Cria a tabela se ela não existir
    // Adicionamos 'numero' como TEXT para facilitar, mas poderia ser NUMERIC
    await client.query("CREATE TABLE IF NOT EXISTS usuarios (id SERIAL PRIMARY KEY, nome TEXT, numero TEXT)");

    // Insere os dados na tabela
    const result = await client.query("INSERT INTO usuarios (nome, numero) VALUES ($1, $2) RETURNING id", [nome, numero]);
    const novoId = result.rows[0].id;
    
    await client.end();

    // Retorna uma resposta de sucesso
    res.status(200).json({ message: "Usuário salvo com sucesso!", id: novoId });
  } catch (err) {
    console.error("Erro ao salvar no banco de dados:", err);
    // Em caso de erro, desconecta o cliente e retorna uma resposta de erro
    await client.end().catch(e => console.error("Erro ao fechar conexão:", e));
    res.status(500).json({ error: "Erro interno do servidor ao salvar os dados." });
  }
}