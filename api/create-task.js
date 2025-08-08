import { Client } from 'pg';
import nodemailer from 'nodemailer'; // Importa o Nodemailer

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { name, dueDate, assignee } = req.body;

    if (!name || !assignee) { // A tarefa precisa de um responsável
        return res.status(400).json({ error: 'O nome da tarefa e o responsável são obrigatórios.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Encontra o e-mail do usuário atribuído
        const userResult = await client.query('SELECT email FROM users WHERE username = $1', [assignee]);
        const assigneeEmail = userResult.rows.length > 0 ? userResult.rows[0].email : null;
        
        if (!assigneeEmail) {
             // Retorna um erro se o usuário não for encontrado ou não tiver e-mail
            await client.end();
            return res.status(400).json({ error: 'Responsável não encontrado ou sem e-mail cadastrado.' });
        }

        // 2. Insere a nova tarefa no banco de dados
        // IMPORTANTE: Use o ID real do usuário aqui, não um placeholder
        const userId = 1; // Substitua por uma forma de obter o ID do usuário logado
        await client.query('INSERT INTO tasks (user_id, name, due_date, assignee) VALUES ($1, $2, $3, $4)', [userId, name, dueDate || null, assignee || null]);

        // 3. Configura e envia o e-mail de notificação
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // Use 'true' se a porta for 465
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: assigneeEmail,
            subject: `Nova Tarefa Atribuída: ${name}`,
            text: `Olá ${assignee}, uma nova tarefa foi atribuída a você: "${name}".\nData de Vencimento: ${dueDate || 'Não especificada'}.`
        };

        await transporter.sendMail(mailOptions);
        
        await client.end();
        res.status(200).json({ message: 'Tarefa criada e e-mail enviado com sucesso!' });
    } catch (err) {
        console.error('Erro detalhado do servidor:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao criar tarefa.' });
    }
}