import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Busca o usuário no banco de dados
        const result = await client.query('SELECT password_hash FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            await client.end();
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = result.rows[0];

        // Compara a senha enviada com o hash salvo no banco de dados
        const match = await bcrypt.compare(password, user.password_hash);
        
        await client.end();

        if (match) {
            // Senha correta!
            // Para um projeto real, aqui você criaria um token de sessão (JWT)
            // e o retornaria para o frontend.
            res.status(200).json({ message: 'Login bem-sucedido!' });
        } else {
            // Senha incorreta
            res.status(401).json({ error: 'Credenciais inválidas.' });
        }
    } catch (err) {
        console.error('Erro ao autenticar usuário:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}