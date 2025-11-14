# 🚀 Guía de Despliegue - FitTrackr

Esta guía te ayudará a desplegar FitTrackr a producción usando Vercel (frontend) y Supabase (backend).

## Prerrequisitos

- ✅ Instalación funcional de FitTrackr
- ✅ Cuenta de GitHub
- ✅ Cuenta de Vercel (el tier gratuito es suficiente)
- ✅ Proyecto de Supabase ya configurado

## Deployment Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │ ───> │    Vercel    │ ───> │  Supabase   │
│   (Users)   │      │  (Frontend)  │      │  (Backend)  │
└─────────────┘      └──────────────┘      └─────────────┘
```

- **Frontend**: Deployed on Vercel (Next.js app)
- **Backend**: Supabase Cloud (PostgreSQL + Auth + Storage)
- **CDN**: Automatic with Vercel
- **SSL**: Automatic HTTPS with Vercel

## Step 1: Prepare Your Code

### 1.1 Push to GitHub

If you haven't already:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - FitTrackr app"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/fittrackr.git
git branch -M main
git push -u origin main
```

### 1.2 Verify Environment Variables

Make sure `.env.local` is in `.gitignore` (it should be by default).

**Never commit:**
- `.env.local`
- `.env`
- Any file containing API keys

## Step 2: Deploy to Vercel

### 2.1 Sign Up / Log In

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Find your `fittrackr` repository
3. Click **"Import"**

### 2.3 Configure Project

**Framework Preset**: Next.js (should be auto-detected)

**Build and Output Settings**: (Keep defaults)
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

### 2.4 Deploy First (To Get Your URL)

**IMPORTANTE**: Primero debes desplegar para obtener tu URL de Vercel.

1. Click **"Deploy"** (puedes dejar las variables de entorno vacías por ahora)
2. Wait 2-3 minutes for the build to complete
3. Una vez completado, Vercel te mostrará tu URL de despliegue
4. Tu URL será algo como: `https://fittrackr-abc123.vercel.app` o `https://tu-proyecto.vercel.app`
5. **Copia esta URL** - la necesitarás en el siguiente paso

**Nota**: Vercel asigna automáticamente una URL basada en el nombre de tu proyecto. Si tu proyecto se llama "fittrackr", la URL será `https://fittrackr.vercel.app` o similar.

### 2.5 Add Environment Variables

Ahora que tienes tu URL de Vercel, agrega las variables de entorno:

1. Ve a **Settings** → **Environment Variables** en tu proyecto de Vercel
2. Agrega las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=https://tu-url-real-de-vercel.vercel.app
```

**Donde obtener cada valor**:
- `NEXT_PUBLIC_SUPABASE_URL`: De tu proyecto Supabase → Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: De tu proyecto Supabase → Settings → API → anon/public key
- `NEXT_PUBLIC_APP_URL`: **La URL que Vercel te dio después del despliegue** (paso 2.4)

**Important**: 
- Puedes agregar estas variables para todos los ambientes (Production, Preview, Development)
- Después de agregar las variables, Vercel hará un nuevo despliegue automáticamente
- Si no se despliega automáticamente, puedes hacer un "Redeploy" manual

Your app is now live! 🎉

## Step 3: Configure Custom Domain (Optional)

### 3.1 Add Domain

1. Go to your project settings
2. Click **"Domains"**
3. Add your custom domain (e.g., `fittrackr.com`)
4. Follow Vercel's instructions to update DNS records

### 3.2 SSL Certificate

Vercel automatically provisions SSL certificates. Your site will be available at `https://yourdomain.com`

## Step 4: Configure Supabase for Production

### 4.1 Update Site URL

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your **real** Vercel deployment URL (la que obtuviste en el paso 2.4):
   - Site URL: `https://tu-url-real-de-vercel.vercel.app` (reemplaza con tu URL real)
4. Add redirect URLs:
   - `https://tu-url-real-de-vercel.vercel.app/auth/callback`
   - `https://tu-url-real-de-vercel.vercel.app/**`
   
**Ejemplo**: Si tu URL de Vercel es `https://fittrackr.vercel.app`, entonces:
   - Site URL: `https://fittrackr.vercel.app`
   - Redirect URLs: `https://fittrackr.vercel.app/auth/callback`

### 4.2 Update Email Templates

In **Authentication** → **Email Templates**, update:
- Confirmation emails to point to your production URL
- Reset password links

### 4.3 Configure OAuth Redirects

If using Google OAuth:
1. Go to **Google Cloud Console** → Your OAuth 2.0 Client
2. Update **Authorized redirect URIs**:
   - `https://your-project.supabase.co/auth/v1/callback` (URL de Supabase - automática)
   - `https://tu-url-real-de-vercel.vercel.app/auth/callback` (URL de tu app - sin locale)

**Important:** The callback URL is `/auth/callback` (without locale) to simplify configuration. The app will handle locale detection after authentication.

## Step 5: Post-Deployment Checklist

### Test Core Features

- [ ] Sign up with a new account
- [ ] Log in with existing account
- [ ] Create a workout
- [ ] Add exercises
- [ ] View dashboard
- [ ] Test dark mode
- [ ] Test on mobile device
- [ ] Test OAuth login (if configured)

### Performance

- [ ] Check Lighthouse score (should be 90+)
- [ ] Test loading times
- [ ] Verify images load correctly
- [ ] Check responsive design on various devices

### Security

- [ ] Verify HTTPS is working
- [ ] Test RLS policies (users can only see their data)
- [ ] Check that API keys are not exposed in browser
- [ ] Test authentication flows

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push

# Vercel automatically:
# 1. Detects the push
# 2. Builds the project
# 3. Deploys to production
# 4. You get a notification when ready
```

### Preview Deployments

Every pull request gets a **preview deployment**:
- Test changes before merging
- Share with team for review
- Automatic URL: `fittrackr-git-branch-name.vercel.app`

## Monitoring and Analytics

### Vercel Analytics

1. Go to your project dashboard
2. Click **"Analytics"**
3. View:
   - Page views
   - Performance metrics
   - User behavior

### Supabase Monitoring

1. In Supabase dashboard
2. Go to **Database** → **Reports**
3. Monitor:
   - Database size
   - API requests
   - Active connections

## Environment-Specific Configurations

### Development vs Production

You might want different configurations:

**Option 1: Use Vercel Environment Variables**
- Add separate values for Preview and Production
- Vercel automatically uses the right ones

**Option 2: Separate Supabase Projects**
- Development project (local development)
- Production project (deployed app)
- Keeps production data safe

## Troubleshooting Deployment

### Build Fails

**Check build logs:**
1. Go to Vercel dashboard
2. Click on the failed deployment
3. Read the error messages

**Common issues:**
- TypeScript errors → Fix in your code
- Missing dependencies → Check `package.json`
- Environment variables → Verify they're set correctly

### App Loads but Features Don't Work

**Check browser console:**
- Look for error messages
- Common: CORS errors, API key issues

**Verify environment variables:**
```bash
# In Vercel dashboard
Settings → Environment Variables
```

### Database Connection Fails

- ✅ Verify Supabase URL in Vercel env vars
- ✅ Check Supabase project is active
- ✅ Verify RLS policies are set up

### Authentication Issues

- ✅ Update Supabase Site URL
- ✅ Add redirect URLs
- ✅ Check OAuth credentials (if using)

## Scaling Considerations

### Free Tier Limits

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- Perfect for personal projects

**Supabase Free Tier:**
- 500 MB database
- 2 GB file storage
- 50,000 monthly active users
- Sufficient for most apps

### When to Upgrade

Consider upgrading when you have:
- More than 10,000 active users
- Database larger than 400 MB
- Need better support
- Want custom domains on multiple projects

## Performance Optimization

### Next.js Optimizations

Already configured:
- ✅ Image optimization
- ✅ Code splitting
- ✅ Static page generation
- ✅ Server-side rendering

### Database Optimizations

For better performance:
- Add indexes on frequently queried columns
- Use pagination for large lists
- Implement caching where appropriate

### CDN and Caching

Vercel automatically:
- Caches static assets
- Serves content from global CDN
- Optimizes images

## Backup Strategy

### Database Backups

Supabase Pro includes:
- Daily automated backups
- Point-in-time recovery

Free tier:
- Export data manually from Table Editor
- Save SQL dumps periodically

### Code Backups

Your code is backed up on GitHub:
- Use branches for features
- Tag releases
- Keep `main` branch stable

## Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to `.gitignore`

2. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

3. **Enable 2FA**
   - GitHub account
   - Vercel account
   - Supabase account

4. **Monitor logs**
   - Check for suspicious activity
   - Review authentication logs

5. **RLS Policies**
   - Verify users can only access their data
   - Test with different user accounts

## Cost Estimation

For a typical fitness app:

**0-1,000 users:**
- Vercel: Free
- Supabase: Free
- **Total: $0/month**

**1,000-10,000 users:**
- Vercel: Free (might need Pro for bandwidth)
- Supabase: Free or $25/month for Pro
- **Total: $0-25/month**

**10,000+ users:**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- **Total: ~$45/month**

## Support and Resources

- 📖 [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- 📖 [Vercel Documentation](https://vercel.com/docs)
- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Vercel Community](https://github.com/vercel/vercel/discussions)
- 💬 [Supabase Discord](https://discord.supabase.com)

## Need Help?

- 🐛 [Open an issue](https://github.com/yourusername/fittrackr/issues)
- 📧 Email: your-email@example.com
- 💬 Community support

---

**Congratulations on deploying FitTrackr! 🚀**

Your fitness tracking app is now live and ready to help users achieve their goals!

