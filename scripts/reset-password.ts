import bcrypt from 'bcryptjs';
import { Pool } from '@neondatabase/serverless';

async function resetPassword() {
  const password = 'ImoLead2024!';
  const hash = await bcrypt.hash(password, 10);
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  await pool.query(
    'UPDATE customers SET password = $1 WHERE email = $2',
    [hash, 'lukaslins259@gmail.com']
  );
  
  console.log('Password atualizada com sucesso!');
  console.log('Email: lukaslins259@gmail.com');
  console.log('Senha: ImoLead2024!');
  await pool.end();
  process.exit(0);
}

resetPassword().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
