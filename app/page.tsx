import { redirect } from 'next/navigation'

export default function HomePage() {
  // Przekierowanie na stronę logowania
  redirect('/login')
}
