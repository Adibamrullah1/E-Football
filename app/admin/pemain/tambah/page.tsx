import PlayerForm from '@/components/admin/PlayerForm'

export default function TambahPemainPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Tambah Pemain Baru</h1>
        <p className="text-muted-foreground">Isi data pemain di bawah ini</p>
      </div>
      <PlayerForm mode="create" />
    </div>
  )
}
