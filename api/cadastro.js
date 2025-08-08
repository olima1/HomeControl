import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // Agora, a API espera o email também
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Nome de usuário, e-mail e senha são obrigatórios.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Verifica se o usuário ou e-mail já existe
        const checkUser = await client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (checkUser.rows.length > 0) {
            await client.end();
            return res.status(409).json({ error: 'Nome de usuário ou e-mail já existe.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insere o novo usuário, incluindo o e-mail
        await client.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
        
        await client.end();

        res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}