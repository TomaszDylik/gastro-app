import type { ReactNode } from 'react'
export default function ManagerRestaurantLayout({ children }: { children: ReactNode }) {
  return <section className="p-6">{children}</section>
}
