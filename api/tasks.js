import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // IMPORTANTE: Em uma aplicação real, você usaria uma sessão
        // para identificar o usuário logado e buscar apenas as tarefas dele.
        // Aqui, para simplificar, vamos buscar todas as tarefas.
        const result = await client.query('SELECT * FROM tasks ORDER BY created_at DESC');

        await client.end();
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar tarefas:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao buscar tarefas.' });
    }
}