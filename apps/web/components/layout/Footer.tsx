import Link from 'next/link'
import Image from 'next/image'
import { mainLogo } from '@/lib/assets'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <Image
                src={mainLogo}
                alt="Wettquoten24 Logo"
                width={120}
                height={30}
                className="object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Der beste Vergleich für Sportwetten Quoten österreichischer Buchmacher.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 Wettquoten24. Alle Rechte vorbehalten.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <nav className="space-y-2">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground">
                Heute
              </Link>
              <Link href="/leagues" className="block text-sm text-muted-foreground hover:text-foreground">
                Ligen
              </Link>
              <Link href="/bookmakers" className="block text-sm text-muted-foreground hover:text-foreground">
                Buchmacher
              </Link>
            </nav>
          </div>

          {/* Bookmakers */}
          <div>
            <h4 className="font-semibold mb-4">Buchmacher (15 österreichische Anbieter)</h4>
            <nav className="space-y-1 text-xs">
              <div className="grid grid-cols-2 gap-x-4">
                <div>
                  <a href="https://www.win2day.at" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    win2day
                  </a>
                  <a href="https://www.tipp3.at" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    tipp3
                  </a>
                  <a href="https://www.bet365.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    bet365
                  </a>
                  <a href="https://www.bwin.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    bwin
                  </a>
                  <a href="https://www.interwetten.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Interwetten
                  </a>
                  <a href="https://www.tipico.at" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Tipico
                  </a>
                  <a href="https://www.betway.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Betway
                  </a>
                  <a href="https://www.admiral.at" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Admiral
                  </a>
                </div>
                <div>
                  <a href="https://www.neo.bet" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    NEO.bet
                  </a>
                  <a href="https://www.tipwin.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Tipwin
                  </a>
                  <a href="https://www.mozzartbet.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Mozzart
                  </a>
                  <a href="https://www.merkurbets.at" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Merkur Bets
                  </a>
                  <a href="https://www.rabona.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Rabona
                  </a>
                  <a href="https://www.bet-at-home.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    bet-at-home
                  </a>
                  <a href="https://www.lottoland.at" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground">
                    Lottoland
                  </a>
                </div>
              </div>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Rechtliches</h4>
            <nav className="space-y-2">
              <Link href="/datenschutz" className="block text-sm text-muted-foreground hover:text-foreground">
                Datenschutz
              </Link>
              <Link href="/impressum" className="block text-sm text-muted-foreground hover:text-foreground">
                Impressum
              </Link>
              <Link href="/agb" className="block text-sm text-muted-foreground hover:text-foreground">
                AGB
              </Link>
            </nav>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t mt-8 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Hinweis:</strong> Glücksspiel kann süchtig machen. Spielen Sie verantwortlich. 
            Für Hilfe besuchen Sie <a href="https://www.spielsuchthilfe.at" className="underline" target="_blank" rel="noopener noreferrer">spielsuchthilfe.at</a>
          </p>
        </div>
      </div>
    </footer>
  )
}