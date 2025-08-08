import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { name, dueDate, assignee } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'O nome da tarefa é obrigatório.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // IMPORTANTE: Use um user_id que você sabe que existe no seu banco de dados.
        const userId = 1; // Mude este ID se o seu primeiro usuário tiver outro ID

        // Consulta SQL corrigida para usar 'id' em vez de 'user_id'
        await client.query('INSERT INTO tasks (id, name, due_date, assignee) VALUES ($1, $2, $3, $4)', [userId, name, dueDate || null, assignee || null]);
        
        await client.end();
        res.status(200).json({ message: 'Tarefa criada com sucesso!' });
    } catch (err) {
        console.error('Erro detalhado do servidor:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao criar tarefa.' });
    }
}