type Props = { params: { token: string } }
export default function InviteAccept({ params }: Props) {
  return (
    <main className="container mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-bold">Zaproszenie</h1>
      <p>
        Token: <code>{params.token}</code>
      </p>
    </main>
  )
}
