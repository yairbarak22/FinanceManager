import { redirect } from 'next/navigation';

// Redirect root to dashboard
export default function AppRoot() {
  redirect('/dashboard');
}

