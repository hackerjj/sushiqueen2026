# Auto-Deploy en Render

Este proyecto está configurado para hacer deploy automático en Render cada vez que haces push a la rama `main`.

## Configuración

### 1. Obtener el Deploy Hook de Render

1. Ve a tu [Dashboard de Render](https://dashboard.render.com/)
2. Selecciona tu servicio `sushi-queen-backend`
3. Ve a **Settings** > **Deploy Hook**
4. Copia la URL del Deploy Hook (algo como: `https://api.render.com/deploy/srv-xxxxx?key=yyyyy`)

### 2. Configurar el Secret en GitHub

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** > **Secrets and variables** > **Actions**
3. Click en **New repository secret**
4. Nombre: `RENDER_DEPLOY_HOOK`
5. Valor: Pega la URL del Deploy Hook que copiaste
6. Click en **Add secret**

## Uso

Una vez configurado, el deploy se ejecutará automáticamente:

- ✅ Cada vez que hagas `git push` a la rama `main`
- ✅ También puedes ejecutarlo manualmente desde GitHub Actions

### Deploy Manual

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Selecciona el workflow **Deploy to Render**
4. Click en **Run workflow**
5. Selecciona la rama `main`
6. Click en **Run workflow**

## Verificar el Deploy

Después de hacer push, puedes verificar el progreso:

1. En GitHub: Ve a **Actions** para ver el log del workflow
2. En Render: Ve a tu servicio para ver el log del deploy

## Notas

- El deploy tarda aproximadamente 5-10 minutos
- Render hace build automático del Docker container
- Si hay errores, revisa los logs en Render Dashboard
