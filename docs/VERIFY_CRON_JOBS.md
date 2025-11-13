# 🔍 Verificar Cron Jobs en Vercel

## Problema: El cron no se ejecuta

Si el endpoint funciona con `?test=true` pero el cron no se ejecuta automáticamente, sigue estos pasos:

## 1. Verificar que el cron esté configurado

El `vercel.json` debe estar en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/push/schedule",
      "schedule": "55 23 * * *"
    }
  ]
}
```

## 2. Verificar en los logs de Vercel

1. Ve a **Vercel Dashboard** → Tu proyecto
2. Ve a **Deployments** → Selecciona el último deployment
3. Haz clic en **Functions**
4. Busca `/api/push/schedule`
5. Revisa los **Logs** para ver si hay ejecuciones

## 3. Verificar el historial de ejecuciones

Los cron jobs de Vercel no tienen una interfaz visual directa, pero puedes:

1. Revisar los logs de la función en diferentes momentos
2. Agregar logging en el código para ver cuándo se ejecuta
3. Usar un servicio externo para monitorear

## 4. Probar manualmente simulando el cron

Puedes probar si el código detecta correctamente las peticiones del cron:

```bash
curl -X POST "https://fit-tracker-iota.vercel.app/api/push/schedule?cron=true" \
  -H "User-Agent: vercel-cron/1.0"
```

## 5. Verificar que el deployment incluya vercel.json

Asegúrate de que `vercel.json` esté en el repositorio y se haya desplegado:

```bash
git add vercel.json
git commit -m "add cron job configuration"
git push
```

## 6. Alternativa: Usar un servicio externo

Si los cron jobs de Vercel no funcionan, puedes usar:

- **cron-job.org** (gratis)
- **EasyCron** (gratis)
- **GitHub Actions** (gratis)

Configura para que llame:
```
POST https://fit-tracker-iota.vercel.app/api/push/schedule?cron=true
```

Schedule: `55 23 * * *` (11:55 PM UTC = 6:55 PM Colombia)

## 7. Verificar logs del código

El código ahora registra cuando es una petición del cron. Revisa los logs en Vercel para ver si aparece:

```
Cron job executed at 23:55 UTC
```

## Solución temporal: Usar servicio externo

Mientras verificas el cron de Vercel, puedes usar cron-job.org:

1. Ve a https://cron-job.org
2. Crea una cuenta gratuita
3. Crea un nuevo cron job:
   - URL: `https://fit-tracker-iota.vercel.app/api/push/schedule?cron=true`
   - Método: POST
   - Schedule: `55 23 * * *` (11:55 PM UTC)
   - Timezone: UTC

Esto garantizará que el cron se ejecute correctamente.

