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
        const result = await client.query('SELECT * FROM shopping_list ORDER BY created_at ASC');
        await client.end();
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar itens:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}