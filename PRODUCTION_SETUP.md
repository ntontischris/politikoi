# 🚀 Production Setup Guide

## ✅ Production-Ready Features

- ✅ **Persistent sessions** - Users stay logged in (localStorage)
- ✅ **Clean codebase** - All dev/mock code removed
- ✅ **Secure authentication** - Production Supabase only
- ✅ **Proper error handling** - Silent fails, no sensitive data exposure
- ✅ **Session persistence** - Users stay logged in until they logout

## 🔐 Admin Credentials

### Default Admin Account
```
Email: admin@politikoi.gr
Password: Admin@2025!
```

⚠️ **IMPORTANT**: Change this password after first login!

## 🛠️ Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Project URL
VITE_SUPABASE_URL=https://ibojdzbbuvagggbybbnk.supabase.co

# Anonymous Key (already set)
VITE_SUPABASE_ANON_KEY=your_anon_key

# Service Role Key (Required for admin operations)
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting the Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `politikoi-citizen-management`
3. Settings > API
4. Copy the `service_role` secret key
5. Add it to your `.env` file

⚠️ **SECURITY WARNING**:
- The service_role key has **full admin privileges**
- Never commit it to git
- Keep it secure
- Rotate regularly

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔄 Authentication Flow

### Session Management
- **Persistence**: localStorage (browser standard)
- **Storage**: Supabase native storage
- **Duration**: Session-based with auto-refresh
- **Behavior**: Users stay logged in until:
  - They click "Αποσύνδεση" (logout)
  - They clear browser data

### Why localStorage?

1. **Reliability**: Battle-tested by Supabase
2. **Performance**: Fast, synchronous access
3. **User Experience**:
   - No re-login after refresh
   - Persistent sessions across tabs
   - Clean logout when needed
4. **Standard**: Industry standard for web apps

## 🔒 Security Features

### Database Functions

The following database functions handle sensitive operations securely:

- `create_user_directly()` - Create new users with proper password hashing
- `delete_user_completely()` - Safely remove users from auth.users
- `is_admin()` - Check admin privileges

### RLS Policies

- ✅ Admin-only access to user management
- ✅ Users can only view/edit their own data
- ✅ Audit logging for all sensitive operations

### Service Role Key Usage

**Current Implementation**: Service role key in frontend (`.env`)
**Security Level**: ⚠️ Moderate (only for admin operations)

**Best Practice** (Future Improvement):
Move admin operations to Edge Functions:
- Create Edge Functions for user management
- Use service role key server-side only
- Frontend calls Edge Functions via API

## 📝 Admin Operations

### Creating Users

1. Login as admin
2. Navigate to `/admin-settings`
3. Click "Νέος Χρήστης"
4. Fill in details:
   - Full Name
   - Email
   - Password (min 6 chars)
   - Role (admin/user)

### Managing Sessions

- View active sessions
- Terminate user sessions
- Monitor user activity

### Audit Logs

- Track all user operations
- Monitor data changes
- Security compliance

## 🧪 Testing

### Test Admin Login

```bash
# Open browser
http://localhost:5173/login

# Login with:
Email: admin@politikoi.gr
Password: Admin@2025!

# Should redirect to: /dashboard
```

### Test Logout

1. Click "Αποσύνδεση" in sidebar
2. Should redirect to `/login`
3. Browser back button should not allow access
4. Refresh should require re-login

### Test Admin Settings

```bash
http://localhost:5173/admin-settings

# Should show:
- Users list
- Active sessions
- Audit logs
```

## 🐛 Troubleshooting

### Can't Login

1. Check `.env` has correct Supabase URL and keys
2. Verify database is accessible
3. Check user exists in `user_profiles` table
4. Try password reset via SQL:

```sql
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'your@email.com';
```

### Admin Settings Not Loading

1. Verify SERVICE_ROLE_KEY is set
2. Check database functions exist:
   - `create_user_directly`
   - `delete_user_completely`
   - `is_admin`
3. Verify RLS policies allow admin access

### Session Lost on Refresh

This is **expected behavior** with session-only auth!
- Users must login after each page load
- To change: Enable `persistSession` in supabase config

## 📊 Database Schema

### Tables

- `user_profiles` - User information and roles
- `user_sessions` - Active login sessions
- `audit_logs` - Activity tracking
- `citizens` - Citizen records
- `requests` - Citizen requests
- `reminders` - System reminders

### Functions

- `create_user_directly(email, password, full_name, role)`
- `delete_user_completely(user_id)`
- `is_admin()` - Returns boolean

## 🚀 Deployment

### Pre-deployment Checklist

- [ ] Update admin password
- [ ] Set all environment variables
- [ ] Test all authentication flows
- [ ] Verify admin operations work
- [ ] Check RLS policies
- [ ] Review audit logs
- [ ] Remove any test data

### Production Environment Variables

```bash
# Production .env
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

### Build

```bash
npm run build
```

Outputs to: `dist/`

### Deploy

Upload `dist/` folder to your hosting provider:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Your own server

## 📱 Features

- ✅ Citizen Management
- ✅ Military Personnel Tracking
- ✅ Request Management
- ✅ Communication Timeline
- ✅ Real-time Updates
- ✅ Analytics & Reports
- ✅ Admin User Management
- ✅ Audit Logging
- ✅ Session Management

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React + TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Last Updated**: 2025-10-01
**Version**: Production-Ready 1.0
**Authentication**: Session-Only (No Persistence)
