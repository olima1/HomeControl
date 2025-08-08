import { Client } from 'pg';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { itemId, item_name, quantity } = req.body;

    if (!itemId || !item_name) {
        return res.status(400).json({ error: 'ID e nome do item são obrigatórios.' });
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Atualiza o item no banco de dados
        await client.query('UPDATE shopping_list SET item_name = $1, quantity = $2 WHERE id = $3', [item_name, quantity || null, itemId]);

        // 2. Busca todos os e-mails de usuários para notificação
        const usersResult = await client.query('SELECT email FROM users WHERE email IS NOT NULL');
        const userEmails = usersResult.rows.map(row => row.email);

        // 3. Envia o e-mail de notificação em um bloco try...catch separado
        try {
            if (userEmails.length > 0) {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    },
                });
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: userEmails.join(','),
                    subject: 'Atualização na Lista de Compras!',
                    text: `O item "${item_name}" foi modificado na lista de compras. Quantidade: ${quantity || 'não especificada'}.`
                };
                await transporter.sendMail(mailOptions);
                console.log('E-mail de notificação de edição enviado com sucesso!');
            }
        } catch (emailError) {
            console.error('Erro ao enviar e-mail de notificação:', emailError);
            // A API continua a execução mesmo com erro de e-mail
        }
        
        await client.end();
        res.status(200).json({ message: 'Item atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar item:', err);
        await client.end().catch(e => console.error(e));
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar item.' });
    }
}