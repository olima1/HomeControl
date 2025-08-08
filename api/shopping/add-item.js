import { Client } from 'pg';
import nodemailer from 'nodemailer';

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

        // 1. Adiciona o novo item
        await client.query('INSERT INTO shopping_list (item_name, quantity) VALUES ($1, $2)', [item_name, quantity || null]);

        // 2. Busca todos os e-mails de usuários para notificação
        const usersResult = await client.query('SELECT email FROM users WHERE email IS NOT NULL');
        const userEmails = usersResult.rows.map(row => row.email);

        // 3. Envia o e-mail de notificação em um bloco try...catch separado
        try {
            if (userEmails.length > 0) {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    secure: false, // Ou 'true' se a porta for 465
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    },
                });
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: userEmails.join(','), // Envia para todos os usuários
                    subject: 'Nova atualização na Lista de Compras!',
                    text: `Um novo item foi adicionado à lista de compras: "${item_name}"`
                };
                await transporter.sendMail(mailOptions);
                console.log('E-mail de notificação enviado com sucesso!');
            }
        } catch (emailError) {
            console.error('Erro ao enviar e-mail de notificação:', emailError);
            // Continua a execução mesmo com erro de e-mail
        }
        
        await client.end();
        res.status(200).json({ message: 'Item adicionado com sucesso!' });
    } catch (err) {
        console.error('Erro ao adicionar item:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao adicionar item.' });
    }
}