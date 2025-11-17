import bcrypt from 'bcryptjs';

const passwords = process.argv.slice(2);
if (passwords.length === 0) {
  console.error('Uso: node scripts/make_hashes.js <pwd1> <pwd2> ...');
  process.exit(1);
}

(async () => {
  for (const pwd of passwords) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pwd, salt);
    console.log(pwd + ' => ' + hash);
  }
})();
