import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { taskId, completed } = req.body;

    if (!taskId || completed === undefined) {
        return res.status(400).json({ error: 'ID da tarefa e status de conclusão são obrigatórios.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query('UPDATE tasks SET completed = $1 WHERE id = $2', [completed, taskId]);
        await client.end();
        res.status(200).json({ message: 'Status da tarefa atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar status da tarefa:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}