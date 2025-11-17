import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ingresa la contraseña a hashear: ', async (password) => {
  if (!password) {
    console.log('❌ Contraseña vacía');
    rl.close();
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('\n✅ Hash generado:');
  console.log(hash);
  console.log('\n📋 Para actualizar en la BD:');
  console.log(`db.users.updateOne({ email: "tu-email@ejemplo.cl" }, { $set: { password_hash: "${hash}" } })`);
  
  rl.close();
});
