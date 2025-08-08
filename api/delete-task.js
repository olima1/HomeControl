import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const taskId = req.query.taskId;

    if (!taskId) {
        return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        await client.end();
        res.status(200).json({ message: 'Tarefa excluída com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir tarefa:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}