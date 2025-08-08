import { Client } from 'pg';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { itemId } = req.query;

    if (!itemId) {
        return res.status(400).json({ error: 'O ID do item é obrigatório.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        await client.query('DELETE FROM shopping_list WHERE id = $1', [itemId]);
        await client.end();
        res.status(200).json({ message: 'Item excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir item:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}