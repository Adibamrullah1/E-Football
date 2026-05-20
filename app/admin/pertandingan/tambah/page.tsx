import MatchForm from '@/components/admin/MatchForm'

export default function TambahPertandinganPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Buat Pertandingan Baru</h1>
        <p className="text-muted-foreground">Tentukan jadwal pertandingan baru</p>
      </div>
      <MatchForm />
    </div>
  )
}
