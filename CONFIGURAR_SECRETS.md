# 🔐 Configurar Secrets de GitHub para Auto-Deploy

## ⚠️ URGENTE - Necesitas Configurar Estos Secrets

Acabo de crear un workflow de GitHub Actions que desplegará automáticamente a Hostinger, pero necesita 3 secrets configurados.

## 📋 Pasos para Configurar

### 1. Ve a GitHub Settings

1. Abre: https://github.com/hackerjj/sushiqueen2026/settings/secrets/actions
2. Click en "New repository secret"

### 2. Agrega Estos 3 Secrets

#### Secret 1: FTP_HOST
- **Name**: `FTP_HOST`
- **Value**: `191.101.79.184`

#### Secret 2: FTP_USER
- **Name**: `FTP_USER`
- **Value**: `u716757676.galt.com.mx`

#### Secret 3: FTP_PASS
- **Name**: `FTP_PASS`
- **Value**: `4Irbus0001!`

## ✅ Después de Configurar

Una vez que agregues los 3 secrets:

1. Haz cualquier cambio pequeño en `deploy-sushiqueen`
2. Haz push
3. Ve a: https://github.com/hackerjj/sushiqueen2026/actions
4. Verás el workflow "Deploy to Hostinger" ejecutándose
5. En 3-5 minutos, los cambios estarán en producción

## 🧪 Probar el Deploy

Después de configurar los secrets, ejecuta:

```bash
git checkout deploy-sushiqueen
echo "# Test deploy $(date)" >> TEST_DEPLOY.md
git add TEST_DEPLOY.md
git commit -m "test: Trigger auto-deploy"
git push origin deploy-sushiqueen
```

Luego ve a GitHub Actions y verás el workflow ejecutándose.

## 🎯 Qué Hace el Workflow

1. ✅ Detecta push a `deploy-sushiqueen`
2. ✅ Instala Node.js 20
3. ✅ Instala dependencias (`npm ci`)
4. ✅ Hace build del frontend (`npm run build`)
5. ✅ Sube archivos a Hostinger vía FTP
6. ✅ Copia `.htaccess`
7. ✅ Muestra resumen del deploy

## ⏰ Tiempo Total

- Configurar secrets: 2 minutos
- Workflow ejecutándose: 3-5 minutos
- **Total: ~7 minutos** desde push hasta producción

## 🔒 Seguridad

Los secrets están encriptados y solo GitHub Actions puede acceder a ellos. Nunca se muestran en los logs.

---

**¡Configura los secrets ahora para que el auto-deploy funcione!**
