# 🔐 Credenciales de Acceso - AgroSens

## Usuarios de Prueba

### 👤 Administrador
- **Email:** `admin@agrosens.cl`
- **Contraseña:** `admin123`
- **Rol:** `admin`
- **Permisos:** Acceso completo + gestión de usuarios

### 🌾 Agricultor
- **Email:** `agricultor@agrosens.cl`
- **Contraseña:** `agro123`
- **Rol:** `agricultor`
- **Permisos:** Acceso completo a funciones de cultivo

---

## 🔧 Cambiar Contraseña

### Opción 1: Script de Hash
```bash
cd backend
node scripts/hash_password.js
# Ingresa tu nueva contraseña
# Copia el hash generado
```

### Opción 2: Actualizar en MongoDB
```javascript
// En mongosh o Compass
use agrosens

// Cambiar contraseña del admin
db.users.updateOne(
  { email: "admin@agrosens.cl" },
  { $set: { password_hash: "tu-nuevo-hash-aqui" } }
)

// Cambiar contraseña del agricultor
db.users.updateOne(
  { email: "agricultor@agrosens.cl" },
  { $set: { password_hash: "tu-nuevo-hash-aqui" } }
)
```

### Opción 3: Crear Nuevo Usuario
```javascript
db.users.insertOne({
  nombre: "Tu Nombre",
  email: "tu-email@ejemplo.cl",
  password_hash: "$2a$10$...", // usar script hash_password.js
  rol: "agricultor", // o "admin"
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 📝 Notas Importantes

- Las contraseñas **nunca** se almacenan en texto plano
- Los hashes bcrypt son únicos cada vez (salt aleatorio)
- En producción, usa contraseñas fuertes (mínimo 12 caracteres)
- El auto-seed crea estos usuarios automáticamente al iniciar el backend

---

## 🚨 Seguridad

- Cambia las contraseñas por defecto en producción
- No compartas estas credenciales
- Usa variables de entorno para secrets
- Habilita 2FA si está disponible
