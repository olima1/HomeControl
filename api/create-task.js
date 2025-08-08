import { Client } from 'pg';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { name, dueDate, assignee } = req.body;

    if (!name || !assignee) {
        return res.status(400).json({ error: 'O nome da tarefa e o responsável são obrigatórios.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Busca o ID e o e-mail do usuário atribuído (assignee)
        const userResult = await client.query('SELECT id, email FROM users WHERE username = $1', [assignee]);
        
        if (userResult.rows.length === 0) {
            await client.end();
            return res.status(400).json({ error: 'Responsável não encontrado.' });
        }

        const userId = userResult.rows[0].id;
        const assigneeEmail = userResult.rows[0].email;
        
        // 2. Insere a nova tarefa no banco de dados
        await client.query(
            'INSERT INTO tasks (user_id, name, due_date, assignee) VALUES ($1, $2, $3, $4)', 
            [userId, name, dueDate || null, assignee]
        );

        // 3. Tenta enviar o e-mail em um bloco try...catch separado
        try {
            if (assigneeEmail) {
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
                console.log('E-mail de notificação enviado com sucesso!');
            }
        } catch (emailError) {
            // Este bloco captura erros apenas do Nodemailer, sem interromper o fluxo principal
            console.error('Erro ao enviar e-mail de notificação:', emailError);
            // A API continua a execução e retorna sucesso
        }

        await client.end();
        res.status(200).json({ message: 'Tarefa criada com sucesso!' });
    } catch (err) {
        // Este catch é apenas para erros na conexão ou na consulta do banco de dados
        console.error('Erro no servidor ao criar tarefa:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao criar tarefa.' });
    }
}