import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { item_name, quantity } = req.body;

    if (!item_name) {
        return res.status(400).json({ error: 'O nome do item é obrigatório.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query('INSERT INTO shopping_list (item_name, quantity) VALUES ($1, $2)', [item_name, quantity || null]);
        await client.end();
        res.status(200).json({ message: 'Item adicionado com sucesso!' });
    } catch (err) {
        console.error('Erro ao adicionar item:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao adicionar item.' });
    }
}