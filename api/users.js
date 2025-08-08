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
        const result = await client.query('SELECT username FROM users ORDER BY username ASC');
        await client.end();
        const users = result.rows.map(row => row.username);
        res.status(200).json({ users });
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}