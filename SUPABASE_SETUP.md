# Supabase Setup Guide

This guide will help you set up Supabase as your backend for this React Native project.

## 🚀 Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and fill in your project details
3. Wait for your project to be set up (this takes ~2 minutes)

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your:
   - **Project URL** (looks like `https://your-project.supabase.co`)
   - **Anon public** key (starts with `eyJ...`)

### 3. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Replace the placeholder values in `.env` with your actual Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

### 4. Set Up Authentication (Optional)

If you want to use authentication:

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your authentication providers (email, Google, etc.)
3. Set up email templates if needed

### 5. Create Database Tables (Optional)

Example table creation for a simple app:

```sql
-- Example: Create a user profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 📱 Using Supabase in Your App

### Authentication

Use the `AuthContext` and `useAuth` hook:

```tsx
import { useAuth } from './src/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth();
  
  // Use authentication methods
}
```

### Database Operations

Use the `dataService` for database operations:

```tsx
import { dataService } from './src/services/dataService';

// Fetch data
const { data, error } = await dataService.fetchData('profiles');

// Insert data
const result = await dataService.insertData('profiles', {
  full_name: 'John Doe',
  email: 'john@example.com'
});
```

### Example Components

- `AuthExample.tsx` - Complete authentication flow
- Check the `src/services/` folder for data operations examples

## 🔧 Available Services

### Authentication Service (`authService`)
- `signUp(email, password)` - Create new user
- `signIn(email, password)` - Sign in user
- `signOut()` - Sign out user
- `getCurrentUser()` - Get current user
- `getCurrentSession()` - Get current session

### Data Service (`dataService`)
- `fetchData(table, columns?, filters?)` - Get data from table
- `insertData(table, data)` - Insert new record
- `updateData(table, id, updates)` - Update existing record
- `deleteData(table, id)` - Delete record
- `uploadFile(bucket, path, file)` - Upload file to storage

## 🛡️ Security Notes

1. **Never expose your service role key** - only use the anon key in your app
2. **Always use Row Level Security (RLS)** for your database tables
3. **Validate data on both client and server side**
4. **Use environment variables** for sensitive configuration

## 📚 Next Steps

1. **Set up your database schema** in the Supabase dashboard
2. **Configure Row Level Security policies** for your tables
3. **Test authentication** using the AuthExample component
4. **Build your app features** using the provided services

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid API key"** - Check your environment variables are correct
2. **"CORS error"** - Ensure you're using the correct Supabase URL
3. **Authentication not persisting** - Make sure AsyncStorage is properly configured

### Getting Help

- Check the Supabase [documentation](https://supabase.com/docs)
- Join the [Supabase Discord](https://discord.supabase.com)
- Check the [GitHub discussions](https://github.com/supabase/supabase/discussions) 