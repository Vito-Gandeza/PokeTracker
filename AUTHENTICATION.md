# Pokemon Collector Authentication System

This document outlines the authentication system implemented in the Pokemon Collector application using Supabase for authentication, database, and storage.

## Authentication Setup

1. **Backend (Supabase)**

   - Authentication system is powered by Supabase Auth
   - User data is stored in Supabase PostgreSQL database
   - Row-level security policies for data protection
   - Database schema with relations between auth users and application data

2. **Auth Flow**

   - Registration: User signs up with email/password and profile data
   - Login: User logs in with email/password
   - Password reset: Email-based password reset flow
   - Session management: JWT-based authentication with automatic token refresh

3. **Protection Mechanisms**
   - Row-level security (RLS) policies to protect data
   - Client-side route protection with ProtectedRoute component
   - Server-side middleware to protect routes
   - Typed data interfaces for type safety

## Implementation Details

### Authentication Files

- `lib/auth.ts` - Core authentication utilities and types
- `lib/auth-context.tsx` - React context for authentication state
- `lib/supabase.ts` - Supabase client instance
- `lib/useApi.ts` - Hooks for authenticated API calls
- `middleware.ts` - NextJS middleware for route protection

### Database Schema

- `auth.users` - Managed by Supabase Auth
- `public.profiles` - User profile data linked to auth.users
- `public.collections` - User card collections
- `public.cards` - Pokemon cards data
- `public.collection_cards` - Junction table for cards in collections

### Security Features

- Row-level security on all tables
- Authentication state management
- Protected routes (client and server side)
- Proper error handling
- Type safety for API calls

## Usage

### Registration

```typescript
// From auth-context.tsx
const { signUp } = useAuth();
const result = await signUp({
  email,
  password,
  fullName,
  username,
});
```

### Login

```typescript
// From auth-context.tsx
const { login } = useAuth();
const result = await login({ email, password });
```

### Protected Routes

```tsx
// Use the ProtectedRoute component in pages that require auth
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### Authenticated API Calls

```typescript
// Use the useApi hook for authenticated API calls
const { data, error, isLoading, mutate } = useApi(
  createQuery("table_name", (query) => query.select("*"))
);
```

## Notes for Future Development

1. **Social Authentication:**

   - Supabase Auth supports social login providers (Google, Facebook, etc.)
   - Configuration in Supabase dashboard required

2. **MFA Implementation:**

   - Two-factor authentication can be added with Supabase Auth

3. **Account Management:**

   - Password change functionality
   - Email change with verification

4. **Admin Features:**
   - Admin dashboard for user management
   - Role-based access control
