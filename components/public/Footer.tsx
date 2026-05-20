import { Gamepad2, Mail, Phone, Wallet, CreditCard, Heart } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-gaming-dark/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon to-neon-blue flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-gaming-dark" />
              </div>
              <div>
                <h3 className="font-gaming text-lg font-bold tracking-wider text-neon">eFOOTBALL</h3>
                <p className="text-[10px] text-muted-foreground -mt-1 tracking-widest uppercase">League</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Platform terdepan untuk mengelola liga sepakbola elektronik. Lihat klasemen, riwayat, dan juara bulanan dengan mudah!
            </p>

            {/* Donation Section */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-gaming-accent/5 border border-primary/10">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                Menerima Segala Donasi 🤗 <span className="text-muted-foreground font-normal">Hubungi dibawah ini</span>
              </p>
              <div className="space-y-2">
                <a href="mailto:amiinuddin1986@gmail.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-neon transition-colors group">
                  <Mail className="w-4 h-4 text-neon/60 group-hover:text-neon" />
                  <span>amiinuddin1986@gmail.com</span>
                </a>
                <a href="tel:+6281361744662" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-neon transition-colors group">
                  <Phone className="w-4 h-4 text-neon/60 group-hover:text-neon" />
                  <span>+6281361744662</span>
                </a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="w-4 h-4 text-neon-blue/60" />
                  <span>Dana: <span className="text-foreground font-medium">085742941138</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4 text-neon-blue/60" />
                  <span>BCA: <span className="text-foreground font-medium">5610407783</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-bold mb-4 text-foreground">Liga</h4>
            <ul className="space-y-2">
              {[
                { href: '/klasemen', label: 'Klasemen' },
                { href: '/jadwal', label: 'Jadwal' },
                { href: '/pemain', label: 'Player' },
                { href: '/juara', label: 'Juara Bulanan' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-neon transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-heading text-lg font-bold mb-4 text-foreground">Info</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-neon transition-colors duration-200">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} eFootball League. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-red-500 fill-red-500" /> untuk para penggemar sepakbola.
          </p>
        </div>
      </div>
    </footer>
  )
}
