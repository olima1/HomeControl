import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        // Exclui tarefas concluídas há mais de 7 dias
        const result = await client.query('DELETE FROM tasks WHERE completed = true AND completed_at < NOW() - INTERVAL \'7 days\'');
        await client.end();
        res.status(200).json({ message: `${result.rowCount} tarefas antigas excluídas com sucesso.` });
    } catch (err) {
        console.error('Erro ao excluir tarefas antigas:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}