import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { taskId, completed } = req.body;

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const updateQuery = completed
            ? 'UPDATE tasks SET completed = $1, completed_at = NOW() WHERE id = $2'
            : 'UPDATE tasks SET completed = $1, completed_at = NULL WHERE id = $2';

        await client.query(updateQuery, [completed, taskId]);

        await client.end();
        res.status(200).json({ message: 'Status da tarefa atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar status da tarefa:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar status da tarefa.' });
    }
}