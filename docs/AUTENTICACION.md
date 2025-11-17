# Autenticación AgroSens

## Resumen
- Roles: `admin`, `agricultor` y modo `invitado` (sin persistencia).
- Login con email + contraseña (bcrypt) → devuelve JWT con `nombre`, `email`, `rol`, `exp`.
- Sesión offline: si un usuario inicia sesión online al menos una vez, la app permite entrar sin internet usando la sesión cacheada.
- Modo invitado: funciona sin internet, no persiste datos tras reinicio y bloquea funciones avanzadas.

## Backend

### Variables .env
```
JWT_SECRET=clave-segura-para-jwt
```

### Modelo `users`
`backend/models/User.js`
```
{
  nombre: String,
  email: String (único, lowercase),
  password_hash: String (bcrypt),
  rol: 'admin' | 'agricultor',
  createdAt: Date,
  updatedAt: Date
}
```

### Endpoints
- `POST /api/auth/login` → Body: `{ email, password }` → Respuesta: `{ token, user: { nombre, email, rol, exp } }`
- `GET /api/auth/me` → Header: `Authorization: Bearer <token>` → Devuelve usuario del token
- `POST /api/auth/logout` → Stateless (cliente elimina token)

### Roles y permisos
- Middleware: `verifyJWT` y `requireRole('admin' | 'agricultor')`
- Rutas `/api/usuarios/*` protegidas para `admin`

### Seeding inicial
`backend/scripts/seed_users.js` crea colección, índice único y usuarios iniciales:
```
db.createCollection("users")

db.users.insertMany([
  {
    nombre: "Administrador AgroSens",
    email: "admin@agrosens.cl",
    password_hash: "$2a$10$ZSEjP8YpQjIfaMqkD1KQ9Oj6gRuP7apGACR6Ujx9E4RyqMG4Pbe8m",
    rol: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    nombre: "Agricultor Demo",
    email: "agricultor@agrosens.cl",
    password_hash: "$2a$10$rJMVxJUE8eD9JhE7KwJGOuBIqbl9Yqk3j0d8JwRr0ZSwa6CBGqD12",
    rol: "agricultor",
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// Índice único en email
db.users.createIndex({ email: 1 }, { unique: true })
```

Comando:
```
cd backend
npm run seed:users
```

## Frontend

### Almacenamiento offline
- Sesión oficial: se cachea en IndexedDB (token + usuario) y en `sessionStorage` para uso inmediato.
- Modo invitado: solo `sessionStorage`, se limpia al reiniciar.

### API de Auth (web)
`frontend/src/utils/auth.js`
- `login(email, password)`
- `logout()`
- `getSession()` (usa cache offline si existe)
- `guestEnter(ack)` (requiere aceptar advertencia)

### UI de Login
`frontend/src/Login.jsx`
- Formulario de email/contraseña
- Botón "Entrar como invitado" con advertencia obligatoria:
  "Los datos no se guardarán al reiniciar el dispositivo. Use su cuenta para evitar pérdida de información."

### Restricción de funciones en invitado
- Bloqueadas: dashboard avanzado, galería, seguimiento, sincronización e historial.

## Notas
- Para React Native usar `AsyncStorage/SecureStore` en lugar de IndexedDB.
- JWT expira en 24h; en modo offline se permite el acceso básico con sesión cacheada hasta reconexión para resincronizar.
