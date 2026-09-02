# Limpieza de archivos Render, Neon y Railway

Se eliminaron los siguientes archivos y documentación:
- ACTUALIZAR_URLS_RENDER.md
- GUIA_DESPLIEGUE_RENDER_NEON.md
- CHECKLIST_DEPLOY.md
- RESUMEN_DEPLOY.md
- backend/NEON_SETUP.md
- railway.json
- backend/railway.json

Y se recomienda limpiar referencias a:
- application-production.yml (PostgreSQL, Neon, Railway)
- .env.example y .env.production.example (variables de Neon, Railway)
- Dockerfile (comentarios de Render)
- README.md (sección de deploy en Render/Neon)

El backend fue diseñado para SQL relacional (PostgreSQL), aunque Firebase se use para autenticación o notificaciones. Si solo usarás Firebase como base de datos, deberás migrar la lógica de persistencia y entidades a Firestore o Realtime Database.
