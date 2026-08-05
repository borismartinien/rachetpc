import { useState } from 'react'

// ─── Web3Forms ────────────────────────────────────────────────────────────────
// 1. Va sur https://web3forms.com
// 2. Entre contact@myitservices.ca et clique "Create Access Key"
// 3. Vérifie ta boîte mail et copie la clé ici
const WEB3FORMS_KEY = 'f7c89c2c-5bc3-4ec3-8298-4180f48f51cc'

async function sendEmail(subject: string, body: string, replyTo?: string) {
  const payload: Record<string, string> = {
    access_key: WEB3FORMS_KEY,
    subject,
    message: body,
    from_name: 'RachetPC',
  }
  if (replyTo) payload.replyto = replyTo

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'idle' | 'form' | 'result' | 'confirmed' | 'declined' | 'negotiate'

interface FormData {
  type: string
  brand: string
  model: string
  year: string
  processor: string
  ram: string
  storage: string
  storageType: string
  gpu: string
  screen: string
  condition: string
  battery: string
  accessories: string[]
  sellerType: string
}

interface ContactData {
  name: string
  email: string
  phone: string
  message: string
}

// ─── Estimation logic ─────────────────────────────────────────────────────────

function estimatePrice(data: FormData): { min: number; max: number } {
  let base = 0

  const yearNum = parseInt(data.year)
  const age = 2026 - yearNum

  // Base by brand
  const brandBase: Record<string, number> = {
    Apple: 600,
    Dell: 400,
    HP: 350,
    Lenovo: 380,
    Asus: 320,
    MSI: 450,
    ACER: 300,
    RAZER: 400,
    Microsoft: 550,
    Chromebook: 150,
    Samsung: 420,
    Autre: 300,
  }
  base = brandBase[data.brand] ?? 300

  // Processor multiplier
  const cpuMult: Record<string, number> = {
    'Intel Core i3': 0.6,
    'Intel Core i5': 0.85,
    'Intel Core i7': 1.1,
    'Intel Core i9': 1.4,
    'AMD Ryzen 5': 0.8,
    'AMD Ryzen 7': 1.05,
    'AMD Ryzen 9': 1.35,
    'Apple M1': 1.3,
    'Apple M2': 1.55,
    'Apple M3': 1.75,
    'Apple M4': 1.95,
  }
  base *= cpuMult[data.processor] ?? 0.75

  // RAM
  const ramAdd: Record<string, number> = {
    '4 Go': -50,
    '8 Go': 0,
    '16 Go': 80,
    '32 Go': 160,
    '64 Go': 280,
  }
  base += ramAdd[data.ram] ?? 0

  // Storage
  const storageAdd: Record<string, number> = {
    '128 Go': -30,
    '256 Go': 0,
    '512 Go': 60,
    '1 To': 120,
    '2 To+': 200,
  }
  base += storageAdd[data.storage] ?? 0

  // Age depreciation
  base *= Math.max(0.3, 1 - age * 0.12)

  // Condition
  const condMult: Record<string, number> = {
    Neuf: 1.0,
    'Très bon': 0.85,
    Bon: 0.7,
    Passable: 0.5,
    'Pour pièces': 0.25,
  }
  base *= condMult[data.condition] ?? 0.6

  // Battery
  if (data.battery.startsWith('Mauvaise')) base *= 0.82
  if (data.battery.startsWith('Excellente')) base *= 1.06

  // GPU bonus
  const gpuAdd: Record<string, number> = {
    'NVIDIA RTX 4080 / 4090': 350,
    'NVIDIA RTX 4060 / 4070': 220,
    'NVIDIA RTX 3070 / 3080': 180,
    'NVIDIA RTX 3050 / 3060': 100,
    'NVIDIA GTX 1650 / 1660': 50,
    'AMD Radeon RX 7600M / 7700M': 160,
    'AMD Radeon RX 6600M / 6700M': 100,
    'Apple GPU (M1/M2/M3/M4)': 0,
    'Graphiques intégrés (Intel / AMD)': -30,
  }
  base += gpuAdd[data.gpu] ?? 0

  // Accessories bonus
  base += data.accessories.length * 15

  const min = Math.round(base * 0.9 / 5) * 5 + 20
  const max = Math.round(base * 1.1 / 5) * 5 + 20

  return { min: Math.max(40, min), max: Math.max(60, max) }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRANDS = ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'MSI', 'ACER', 'RAZER', 'Microsoft', 'Samsung', 'Chromebook', 'Autre']
const PROCESSORS = [
  'Apple M4', 'Apple M3', 'Apple M2', 'Apple M1',
  'Intel Core i9', 'Intel Core i7', 'Intel Core i5', 'Intel Core i3',
  'AMD Ryzen 9', 'AMD Ryzen 7', 'AMD Ryzen 5', 'AMD Ryzen 3',
]
const RAM_OPTIONS = ['4 Go', '8 Go', '16 Go', '32 Go', '64 Go', '128 Go+']
const STORAGE_OPTIONS = ['128 Go', '256 Go', '512 Go', '1 To', '2 To', '4 To+']
const STORAGE_TYPES = ['SSD NVMe', 'SSD SATA', 'HDD', 'eMMC', 'SSD Apple (M-series)']
const GPU_OPTIONS = [
  'Graphiques intégrés (Intel / AMD)',
  'Apple GPU (M1/M2/M3/M4)',
  'NVIDIA GTX 1650 / 1660',
  'NVIDIA RTX 3050 / 3060',
  'NVIDIA RTX 3070 / 3080',
  'NVIDIA RTX 4060 / 4070',
  'NVIDIA RTX 4080 / 4090',
  'AMD Radeon RX 6600M / 6700M',
  'AMD Radeon RX 7600M / 7700M',
  'Je ne sais pas',
]
const SCREEN_OPTIONS = ['11-12"', '13-14"', '15-16"', '17"+']
const CONDITIONS = ['Neuf', 'Très bon', 'Bon', 'Passable', 'Pour pièces']
const BATTERIES = ['Excellente (80–100%)', 'Bonne (60–79%)', 'Mauvaise (< 60%)']
const ACCESSORIES_LIST = ['Chargeur', 'Boîte originale', 'Souris', 'Housse / Sac', 'Clavier externe', 'Adaptateurs']
const YEARS = Array.from({ length: 15 }, (_, i) => String(2026 - i))

// ─── Sub-components ──────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors appearance-none cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7f6b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
      >
        <option value="">— Sélectionner —</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

function CheckGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (o: string) => {
    selected.includes(o) ? onChange(selected.filter((x) => x !== o)) : onChange([...selected, o])
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`px-3 py-1.5 rounded text-sm border transition-all ${
              selected.includes(o)
                ? 'bg-[#00e87a]/10 border-[#00e87a] text-[#00e87a]'
                : 'bg-[#0f160f] border-[#1e2a1e] text-[#6b7f6b] hover:border-[#2a3a2a] hover:text-[#f0f5f0]'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Nav({ onEstimate, onContact }: { onEstimate: () => void; onContact: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-[#1e2a1e] bg-[#0a0f0d]/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="font-display font-800 text-xl text-[#f0f5f0] tracking-tight">
          RACH<span className="text-[#00e87a]">ET</span>PC
        </span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm text-[#6b7f6b]">
        <a href="#comment" className="hover:text-[#f0f5f0] transition-colors">Comment ça marche</a>
        <a href="#pourquoi" className="hover:text-[#f0f5f0] transition-colors">Pourquoi nous</a>
        <a href="#faq" className="hover:text-[#f0f5f0] transition-colors">FAQ</a>
        <button onClick={onContact} className="hover:text-[#f0f5f0] transition-colors">Contact</button>
      </div>
      <button
        onClick={onEstimate}
        className="font-display font-600 text-sm bg-[#00e87a] text-[#0a0f0d] px-5 py-2 rounded hover:bg-[#00b85f] transition-colors"
      >
        Estimer mon PC
      </button>
    </nav>
  )
}

function Hero({ onEstimate }: { onEstimate: () => void }) {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-24 pb-16 relative overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#1e2a1e 1px, transparent 1px), linear-gradient(90deg, #1e2a1e 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        opacity: 0.3,
      }} />
      <div className="relative max-w-5xl mx-auto w-full">
        <div className="font-mono-label text-xs text-[#00e87a] tracking-widest mb-6 uppercase">
          // Rachat laptop · Particuliers & Entreprises
        </div>
        <h1 className="font-display font-800 text-5xl md:text-7xl lg:text-8xl text-[#f0f5f0] leading-none tracking-tight mb-6">
          Votre laptop<br />
          <span className="text-[#00e87a]">vaut de l'argent.</span><br />
          On vous le prouve.
        </h1>
        <p className="text-[#6b7f6b] text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Obtenez une estimation instantanée et sans engagement pour votre PC portable. Particulier ou entreprise — on rachète tout.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onEstimate}
            className="font-display font-700 text-lg bg-[#00e87a] text-[#0a0f0d] px-8 py-4 rounded hover:bg-[#00b85f] transition-colors inline-flex items-center gap-2"
          >
            Obtenir mon estimation
            <span className="text-xl">→</span>
          </button>
          <a
            href="#comment"
            className="font-display font-600 text-lg border border-[#1e2a1e] text-[#f0f5f0] px-8 py-4 rounded hover:border-[#2a3a2a] hover:bg-[#111811] transition-colors inline-flex items-center gap-2"
          >
            Comment ça marche
          </a>
        </div>
        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg">
          {[
            { val: '2 400+', label: 'PC rachetés' },
            { val: '48h', label: 'Paiement max' },
            { val: '100%', label: 'Sans engagement' },
          ].map((s) => (
            <div key={s.label} className="border-l-2 border-[#00e87a] pl-4">
              <div className="font-display font-700 text-2xl text-[#f0f5f0]">{s.val}</div>
              <div className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Remplissez le formulaire', desc: "Indiquez les caractéristiques de votre laptop : marque, modèle, état, configuration. Ça prend moins de 2 minutes." },
    { num: '02', title: 'Recevez votre estimation', desc: "Notre algorithme calcule instantanément la valeur de marché de votre appareil. Transparent, sans surprise." },
    { num: '03', title: 'Acceptez ou déclinez', desc: "Vous êtes libre. Si l'offre vous convient, on organise la collecte. Sinon, aucun engagement, aucun frais." },
    { num: '04', title: 'Payé sous 48h', desc: "Après vérification de l'appareil, vous recevez votre virement. Vite, simplement, sans tracas." },
  ]
  return (
    <section id="comment" className="py-24 px-6 md:px-12 border-t border-[#1e2a1e]">
      <div className="max-w-5xl mx-auto">
        <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// Processus</div>
        <h2 className="font-display font-700 text-4xl md:text-5xl text-[#f0f5f0] mb-16">Comment ça marche</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="bg-[#111811] border border-[#1e2a1e] rounded-lg p-8 hover:border-[#2a3a2a] transition-colors">
              <div className="font-display font-800 text-5xl text-[#00e87a]/20 mb-4">{s.num}</div>
              <h3 className="font-display font-600 text-xl text-[#f0f5f0] mb-3">{s.title}</h3>
              <p className="text-[#6b7f6b] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyUs() {
  const perks = [
    { icon: '⚡', title: 'Estimation instantanée', desc: "Pas d'attente. Remplissez le formulaire, obtenez votre offre en temps réel." },
    { icon: '🔒', title: 'Données effacées garanties', desc: 'Chaque appareil est remis à zéro selon les normes NIST. Vos données disparaissent.' },
    { icon: '🏢', title: 'Offre entreprise dédiée', desc: 'Vous liquidez un parc informatique ? On gère les volumes, la logistique, et la conformité RGPD.' },
    { icon: '💸', title: 'Meilleur prix garanti', desc: "On bat n'importe quelle offre concurrente de 5% si vous nous montrez une preuve écrite." },
    { icon: '📦', title: 'Collecte à domicile sous certaines conditions', desc: "Pas besoin de vous déplacer. On vient chercher le matériel chez vous ou en entreprise." },
    { icon: '✅', title: 'Sans engagement', desc: "L'estimation est gratuite. Vous refusez l'offre ? Aucun frais, aucune pression." },
  ]
  return (
    <section id="pourquoi" className="py-24 px-6 md:px-12 border-t border-[#1e2a1e] bg-[#111811]">
      <div className="max-w-5xl mx-auto">
        <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// Avantages</div>
        <h2 className="font-display font-700 text-4xl md:text-5xl text-[#f0f5f0] mb-16">Pourquoi nous choisir</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {perks.map((p) => (
            <div key={p.title} className="bg-[#0a0f0d] border border-[#1e2a1e] rounded-lg p-6 hover:border-[#00e87a]/30 transition-colors group">
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="font-display font-600 text-lg text-[#f0f5f0] mb-2 group-hover:text-[#00e87a] transition-colors">{p.title}</h3>
              <p className="text-[#6b7f6b] text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: "Quels types de laptops rachetez-vous ?", a: "Tous types : MacBook, PC Windows, Chromebook, workstations mobiles. Fonctionnel ou en panne partielle, on évalue tout. Seuls les appareils complètement hors service (brûlés, oxydés) sont exclus." },
    { q: "Comment est calculée l'estimation ?", a: "Notre algorithme analyse la marque, la configuration, l'année, l'état général et la demande actuelle du marché de revente. L'offre finale peut varier légèrement après inspection physique, mais jamais de plus de 10%." },
    { q: "Je vends pour mon entreprise, comment ça se passe ?", a: "On propose un service dédié aux entreprises : prise en charge de parcs entiers, certificats de destruction des données, factures récapitulatives et collecte planifiée. Contactez-nous directement pour un devis sur volume." },
    { q: "Quand suis-je payé ?", a: "Le virement est émis dans les 48 heures ouvrées après réception et vérification de l'appareil. Pour les volumes enterprise, des conditions spécifiques s'appliquent." },
    { q: "Et si l'appareil ne correspond pas à ma description ?", a: "On vous recontacte avec une offre révisée. Vous êtes toujours libre d'accepter ou de récupérer votre matériel — les frais de retour sont à notre charge." },
  ]
  return (
    <section id="faq" className="py-24 px-6 md:px-12 border-t border-[#1e2a1e]">
      <div className="max-w-3xl mx-auto">
        <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// FAQ</div>
        <h2 className="font-display font-700 text-4xl md:text-5xl text-[#f0f5f0] mb-12">Questions fréquentes</h2>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="border border-[#1e2a1e] rounded-lg overflow-hidden">
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-[#111811] transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-display font-500 text-[#f0f5f0]">{item.q}</span>
                <span className={`text-[#00e87a] text-xl font-mono-label transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-[#6b7f6b] leading-relaxed border-t border-[#1e2a1e] pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


//-copilot test
function SeoContent() {
  return (
    <section className="py-24 px-6 md:px-12 border-t border-[#1e2a1e] bg-[#111811]">
      <div className="max-w-5xl mx-auto">

        <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">
          // Services
        </div>

        <h2 className="font-display font-700 text-4xl md:text-5xl text-[#f0f5f0] mb-8">
          Rachat de laptops au Québec
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-[#0a0f0d] border border-[#1e2a1e] rounded-lg p-6">
            <h3 className="text-xl text-[#f0f5f0] mb-3">
              Rachat MacBook Montréal
            </h3>

            <p className="text-[#6b7f6b]">
              Nous rachetons les MacBook Air et MacBook Pro à Montréal.
              Les modèles M1, M2, M3 et M4 sont admissibles à une estimation
              instantanée et gratuite.
            </p>
          </div>

          <div className="bg-[#0a0f0d] border border-[#1e2a1e] rounded-lg p-6">
            <h3 className="text-xl text-[#f0f5f0] mb-3">
              Rachat ordinateur portable Québec
            </h3>

            <p className="text-[#6b7f6b]">
              Dell, Lenovo, HP, Asus, MSI, Surface et Samsung.
              Nous proposons une estimation rapide partout au Québec.
            </p>
          </div>

          <div className="bg-[#0a0f0d] border border-[#1e2a1e] rounded-lg p-6">
            <h3 className="text-xl text-[#f0f5f0] mb-3">
              Comment vendre son laptop usagé ?
            </h3>

            <p className="text-[#6b7f6b]">
              Sauvegardez vos données, réinitialisez l'appareil et conservez
              le chargeur afin d'obtenir la meilleure valeur possible.
            </p>
          </div>

          <div className="bg-[#0a0f0d] border border-[#1e2a1e] rounded-lg p-6">
            <h3 className="text-xl text-[#f0f5f0] mb-3">
              Rachat informatique entreprise
            </h3>

            <p className="text-[#6b7f6b]">
              Solutions de reprise de parcs informatiques pour entreprises
              avec effacement sécurisé et récupération du matériel.
            </p>
          </div>

        </div>

      </div>
    </section>
  )
}
// ─── Legal / Privacy / Contact modals ───────────────────────────────────────

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="p-8 max-h-[80vh] overflow-y-auto">
        <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// Mentions légales</div>
        <h2 className="font-display font-700 text-2xl text-[#f0f5f0] mb-6">Mentions légales</h2>
        <div className="flex flex-col gap-6 text-sm text-[#6b7f6b] leading-relaxed">
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Éditeur du site</h3>
            <p>Le site <strong className="text-[#f0f5f0]">RACHETPC</strong> est édité par <strong className="text-[#f0f5f0]">My IT Services</strong>, entreprise individuelle enregistrée au Canada (Québec).</p>
            <p className="mt-2">Courriel : <a href="mailto:contact@myitservices.ca" className="text-[#00e87a] hover:underline">contact@myitservices.ca</a></p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Activité</h3>
            <p>RACHETPC est une plateforme de rachat de laptops usagés destinée aux particuliers et aux entreprises au Québec et au Canada. Notre service consiste à évaluer, racheter et revendre du matériel informatique reconditionné.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Hébergement</h3>
            <p>Ce site est hébergé par <strong className="text-[#f0f5f0]">Figma Make</strong>. Pour toute question relative à l'hébergement, veuillez contacter notre équipe à l'adresse ci-dessus.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Propriété intellectuelle</h3>
            <p>L'ensemble des contenus présents sur ce site (textes, images, logos, icônes, structure) sont la propriété exclusive de My IT Services et sont protégés par les lois canadiennes sur le droit d'auteur. Toute reproduction, même partielle, est strictement interdite sans autorisation écrite préalable.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Estimations et offres</h3>
            <p>Les estimations fournies par notre formulaire sont indicatives et basées sur les informations communiquées par l'utilisateur. Elles ne constituent pas une offre d'achat ferme. L'offre définitive est émise après inspection physique de l'appareil. My IT Services se réserve le droit de modifier ou d'annuler toute offre si les caractéristiques réelles de l'appareil diffèrent de celles déclarées.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Limitation de responsabilité</h3>
            <p>My IT Services ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation de ce site. Nous mettons tout en œuvre pour maintenir le site accessible et à jour, mais ne garantissons pas l'exactitude en temps réel des informations affichées.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Droit applicable</h3>
            <p>Le présent site et ses conditions d'utilisation sont soumis au droit en vigueur dans la province de Québec, Canada. Tout litige sera porté devant les tribunaux compétents de la juridiction de Montréal.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Contact</h3>
            <p>Pour toute question relative aux présentes mentions légales : <a href="mailto:contact@myitservices.ca" className="text-[#00e87a] hover:underline">contact@myitservices.ca</a></p>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="p-8 max-h-[80vh] overflow-y-auto">
        <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// Confidentialité</div>
        <h2 className="font-display font-700 text-2xl text-[#f0f5f0] mb-6">Politique de confidentialité</h2>
        <div className="flex flex-col gap-6 text-sm text-[#6b7f6b] leading-relaxed">
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Responsable du traitement</h3>
            <p><strong className="text-[#f0f5f0]">My IT Services</strong> — <a href="mailto:contact@myitservices.ca" className="text-[#00e87a] hover:underline">contact@myitservices.ca</a></p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Données collectées</h3>
            <p>Dans le cadre de l'utilisation de notre formulaire d'estimation et de contact, nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
              <li>Nom et prénom</li>
              <li>Adresse courriel</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Caractéristiques techniques de l'appareil soumis à l'estimation</li>
              <li>Messages et contre-offres éventuels</li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Finalités du traitement</h3>
            <p>Vos données sont collectées pour :</p>
            <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
              <li>Calculer et vous transmettre une estimation de rachat</li>
              <li>Vous contacter pour organiser la collecte de votre appareil</li>
              <li>Répondre à vos questions et demandes de négociation</li>
              <li>Améliorer notre algorithme d'estimation (données anonymisées)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Base légale</h3>
            <p>Le traitement de vos données est fondé sur votre consentement explicite lors de la soumission du formulaire, et sur l'exécution des mesures précontractuelles à votre demande (estimation et rachat).</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Conservation des données</h3>
            <p>Vos données personnelles sont conservées pour une durée maximale de <strong className="text-[#f0f5f0]">24 mois</strong> à compter de votre dernier contact. Les données relatives aux transactions finalisées sont conservées <strong className="text-[#f0f5f0]">7 ans</strong> conformément aux obligations comptables en vigueur.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Partage des données</h3>
            <p>Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées uniquement avec des prestataires techniques (hébergement, envoi de courriels) dans le cadre strict de l'exécution du service, et sous contrat de confidentialité.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Vos droits</h3>
            <p>Conformément à la <em>Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25)</em> du Québec, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la portabilité</li>
              <li>Droit de retrait du consentement</li>
            </ul>
            <p className="mt-2">Pour exercer vos droits : <a href="mailto:contact@myitservices.ca" className="text-[#00e87a] hover:underline">contact@myitservices.ca</a></p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Cookies</h3>
            <p>Ce site n'utilise pas de cookies de traçage ou publicitaires. Seuls des cookies techniques essentiels au fonctionnement du site peuvent être déposés, sans collecte de données personnelles identifiables.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Sécurité</h3>
            <p>Nous appliquons des mesures de sécurité adaptées pour protéger vos données contre tout accès non autorisé, perte ou altération : chiffrement HTTPS, accès restreint aux données, politique de mots de passe renforcée.</p>
          </div>
          <div>
            <h3 className="font-display font-600 text-[#f0f5f0] mb-2">Mise à jour</h3>
            <p>Cette politique de confidentialité peut être mise à jour à tout moment. La version en vigueur est celle affichée sur cette page. Dernière mise à jour : <strong className="text-[#f0f5f0]">août 2026</strong>.</p>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

function ContactModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const isValid = form.name && form.email && form.message

  const handleSend = async () => {
    if (!isValid) return
    setStatus('sending')
    try {
      await sendEmail(
        `[RachetPC] Message de ${form.name} — ${form.subject || 'Contact'}`,
        `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MESSAGE CLIENT — RACHETPC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom       : ${form.name}
Courriel  : ${form.email}
Téléphone : ${form.phone || '—'}
Sujet     : ${form.subject || '—'}

Message :
${form.message}
`.trim(),
        form.email,
      )
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-[#00e87a]/10 border border-[#00e87a] flex items-center justify-center mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="font-display font-700 text-2xl text-[#f0f5f0] mb-3">Message envoyé !</h2>
          <p className="text-[#6b7f6b] max-w-sm mb-6">Merci <strong className="text-[#f0f5f0]">{form.name}</strong>. Notre équipe vous répondra à <strong className="text-[#f0f5f0]">{form.email}</strong> dans les plus brefs délais.</p>
          <button onClick={onClose} className="text-[#6b7f6b] hover:text-[#f0f5f0] transition-colors text-sm">Fermer</button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="p-8">
        <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// Contactez-nous</div>
        <h2 className="font-display font-700 text-2xl text-[#f0f5f0] mb-1">Parlez-nous</h2>
        <p className="text-[#6b7f6b] text-sm mb-6">Questions, volume entreprise, remarque, suggestion, partenariat — on répond sous 24h.</p>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Nom *</label>
              <input type="text" placeholder="Jean Tremblay" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Téléphone</label>
              <input type="tel" placeholder="514 000 0000" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Courriel *</label>
            <input type="email" placeholder="jean@exemple.ca" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Sujet</label>
            <input type="text" placeholder="Question, partenariat, volume entreprise…" value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Message *</label>
            <textarea rows={4} placeholder="Votre message…" value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a] resize-none" />
          </div>
          {status === 'error' && (
            <p className="text-red-400 text-xs">Erreur d'envoi. Vous pouvez nous écrire directement à <a href="mailto:contact@myitservices.ca" className="underline">contact@myitservices.ca</a></p>
          )}
          <button
            onClick={handleSend}
            disabled={!isValid || status === 'sending'}
            className={`font-display font-700 text-base py-3.5 rounded transition-colors mt-1 ${
              isValid && status !== 'sending'
                ? 'bg-[#00e87a] text-[#0a0f0d] hover:bg-[#00b85f]'
                : 'bg-[#111811] text-[#2a3a2a] cursor-not-allowed border border-[#1e2a1e]'
            }`}
          >
            {status === 'sending' ? 'Envoi en cours…' : 'Envoyer le message →'}
          </button>
          <p className="text-xs text-[#6b7f6b] text-center">Ou écrivez-nous directement : <a href="mailto:contact@myitservices.ca" className="text-[#00e87a] hover:underline">contact@myitservices.ca</a></p>
        </div>
      </div>
    </ModalShell>
  )
}

function Footer({ onEstimate, onContact, onLegal, onPrivacy }: { onEstimate: () => void; onContact: () => void; onLegal: () => void; onPrivacy: () => void }) {
  return (
    <footer className="border-t border-[#1e2a1e] py-16 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          <div>
            <div className="font-display font-800 text-2xl text-[#f0f5f0] tracking-tight mb-2">
              RACH<span className="text-[#00e87a]">ET</span>PC
            </div>
            <p className="text-[#6b7f6b] text-sm max-w-xs">Rachat de laptops pour particuliers et entreprises. Rapide, transparent, sans engagement.</p>
          </div>
          <button
            onClick={onEstimate}
            className="font-display font-700 bg-[#00e87a] text-[#0a0f0d] px-6 py-3 rounded hover:bg-[#00b85f] transition-colors"
          >
            Estimer mon PC maintenant
          </button>
        </div>
        <div className="border-t border-[#1e2a1e] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-mono-label text-xs text-[#6b7f6b]">© 2026 RACHETPC — Tous droits réservés</p>
            <p className="font-mono-label text-xs text-[#2a3a2a]">
              Conçu et développé par{' '}
              <a href="https://myitservices.ca" target="_blank" rel="noopener noreferrer" className="text-[#00e87a]/60 hover:text-[#00e87a] transition-colors">
                myitservices.ca
              </a>
            </p>
          </div>
          <div className="flex gap-6 text-xs text-[#6b7f6b]">
            <button onClick={onLegal} className="hover:text-[#f0f5f0] transition-colors">Mentions légales</button>
            <button onClick={onPrivacy} className="hover:text-[#f0f5f0] transition-colors">Politique de confidentialité</button>
            <button onClick={onContact} className="hover:text-[#f0f5f0] transition-colors">Contact</button>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Estimation Form Modal ────────────────────────────────────────────────────

const EMPTY_FORM: FormData = {
  type: '',
  brand: '',
  model: '',
  year: '',
  processor: '',
  ram: '',
  storage: '',
  storageType: '',
  gpu: '',
  screen: '',
  condition: '',
  battery: '',
  accessories: [],
  sellerType: '',
}

const EMPTY_CONTACT: ContactData = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

function EstimationModal({
  step,
  setStep,
  onClose,
}: {
  step: Step
  setStep: (s: Step) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [contact, setContact] = useState<ContactData>(EMPTY_CONTACT)
  const [formStep, setFormStep] = useState(1)
  const [estimate, setEstimate] = useState<{ min: number; max: number } | null>(null)

  const update = (k: keyof FormData) => (v: string | string[]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const updateContact = (k: keyof ContactData) => (v: string) =>
    setContact((c) => ({ ...c, [k]: v }))

  const isStep1Valid = form.sellerType && form.brand && form.year && form.condition
  const isStep2Valid = form.processor && form.ram && form.storage && form.screen && form.battery
  const isContactValid = contact.name && contact.email

  const buildEstimationEmailBody = (est: { min: number; max: number }) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 NOUVELLE ESTIMATION — RACHETPC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PRIX ESTIMÉ : ${est.min} $ – ${est.max} $ CAD

👤 VENDEUR
  Type       : ${form.sellerType}

💻 APPAREIL
  Marque     : ${form.brand}
  Modèle     : ${form.model || '—'}
  Année      : ${form.year}
  État       : ${form.condition}

⚙️ CONFIGURATION
  Processeur : ${form.processor}
  RAM        : ${form.ram}
  Stockage   : ${form.storage} — ${form.storageType || '—'}
  GPU        : ${form.gpu || '—'}
  Écran      : ${form.screen}
  Batterie   : ${form.battery}
  Accessoires: ${form.accessories.join(', ') || 'Aucun'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action requise : contacter le client pour finaliser le rachat.
`.trim()

  const handleEstimate = () => {
    const est = estimatePrice(form)
    setEstimate(est)
    setStep('result')
    sendEmail(
      `[RachetPC] Nouvelle estimation — ${form.brand} ${form.model || ''} ${form.year} — ${est.min}$–${est.max}$ CAD`,
      buildEstimationEmailBody(est),
    )
  }

  if (step === 'confirmed') {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-[#00e87a]/10 border border-[#00e87a] flex items-center justify-center mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="font-display font-700 text-3xl text-[#f0f5f0] mb-3">Demande envoyée !</h2>
          <p className="text-[#6b7f6b] max-w-sm mb-8 leading-relaxed">
            Merci <strong className="text-[#f0f5f0]">{contact.name}</strong>. Nous vous répondrons à{' '}
            <strong className="text-[#f0f5f0]">{contact.email}</strong> dans les 24 heures.
          </p>
          <div className="bg-[#111811] border border-[#1e2a1e] rounded-lg px-8 py-4 mb-8">
            <div className="font-mono-label text-xs text-[#6b7f6b] mb-1 uppercase tracking-widest">Votre offre confirmée</div>
            <div className="font-display font-700 text-4xl text-[#00e87a]">
              {estimate?.min} $ – {estimate?.max} $ CAD
            </div>
          </div>
          <button onClick={onClose} className="text-[#6b7f6b] hover:text-[#f0f5f0] transition-colors text-sm">
            Fermer
          </button>
        </div>
      </ModalShell>
    )
  }

  if (step === 'negotiate') {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-8">
          <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// Négociation</div>
          <h2 className="font-display font-700 text-2xl text-[#f0f5f0] mb-2">Proposez votre prix</h2>
          <p className="text-[#6b7f6b] text-sm mb-6 leading-relaxed">
            Notre estimation était de{' '}
            <span className="text-[#00e87a] font-600">{estimate?.min} $ – {estimate?.max} $ CAD</span>. Dites-nous votre contre-offre et on revient vers vous rapidement.
          </p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Nom *</label>
                <input
                  type="text"
                  placeholder="Jean Tremblay"
                  value={contact.name}
                  onChange={(e) => updateContact('name')(e.target.value)}
                  className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Téléphone</label>
                <input
                  type="tel"
                  placeholder="514 000 0000"
                  value={contact.phone}
                  onChange={(e) => updateContact('phone')(e.target.value)}
                  className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Email *</label>
              <input
                type="email"
                placeholder="jean@exemple.ca"
                value={contact.email}
                onChange={(e) => updateContact('email')(e.target.value)}
                className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Votre contre-offre ($ CAD) *</label>
              <input
                type="text"
                placeholder="ex : 650 $"
                value={contact.message}
                onChange={(e) => updateContact('message')(e.target.value)}
                className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep('result')}
                className="font-display font-600 border border-[#1e2a1e] text-[#6b7f6b] px-5 py-3 rounded hover:border-[#2a3a2a] hover:text-[#f0f5f0] transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={() => {
                setStep('confirmed')
                sendEmail(
                  `[RachetPC] 🔁 CONTRE-OFFRE — ${form.brand} ${form.model || ''} — Client: ${contact.name}`,
                  `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CONTRE-OFFRE CLIENT — RACHETPC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Notre estimation : ${estimate?.min} $ – ${estimate?.max} $ CAD
💬 Contre-offre     : ${contact.message}

📞 COORDONNÉES
  Nom        : ${contact.name}
  Courriel   : ${contact.email}
  Téléphone  : ${contact.phone || '—'}

💻 APPAREIL
  ${form.brand} ${form.model || ''} (${form.year}) — ${form.condition}
  ${form.processor} / ${form.ram} / ${form.storage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action : négocier avec ${contact.name} — ${contact.email}
`.trim(),
                  contact.email,
                )
              }}
                disabled={!isContactValid || !contact.message}
                className={`flex-1 font-display font-700 text-base py-3 rounded transition-colors ${
                  isContactValid && contact.message
                    ? 'bg-[#00e87a] text-[#0a0f0d] hover:bg-[#00b85f]'
                    : 'bg-[#111811] text-[#2a3a2a] cursor-not-allowed border border-[#1e2a1e]'
                }`}
              >
                Envoyer ma contre-offre →
              </button>
            </div>
          </div>
        </div>
      </ModalShell>
    )
  }

  if (step === 'declined') {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-[#1e2a1e] flex items-center justify-center mb-6">
            <span className="text-3xl text-[#6b7f6b]">↩</span>
          </div>
          <h2 className="font-display font-700 text-3xl text-[#f0f5f0] mb-3">Pas de problème.</h2>
          <p className="text-[#6b7f6b] max-w-sm mb-8 leading-relaxed">
            Aucun engagement pris, aucun frais. Revenez quand vous le souhaitez — les prix du marché bougent, votre offre aussi.
          </p>
          <button
            onClick={onClose}
            className="font-display font-600 bg-[#111811] border border-[#1e2a1e] text-[#f0f5f0] px-6 py-3 rounded hover:border-[#2a3a2a] transition-colors"
          >
            Fermer
          </button>
        </div>
      </ModalShell>
    )
  }

  if (step === 'result' && estimate) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-8">
          <div className="font-mono-label text-xs text-[#00e87a] uppercase tracking-widest mb-4">// Estimation de votre laptop</div>

          {/* Summary */}
          <div className="bg-[#111811] border border-[#1e2a1e] rounded-lg p-4 mb-5 grid grid-cols-2 gap-2 text-xs">
            {[
              ['Marque', form.brand],
              ['Année', form.year],
              ['Processeur', form.processor],
              ['RAM', form.ram],
              ['Stockage', `${form.storage} ${form.storageType}`],
              ['Carte graphique', form.gpu || '—'],
              ['Écran', form.screen],
              ['Batterie', form.battery.split(' ')[0]],
              ['État', form.condition],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-[#6b7f6b]">{k} : </span>
                <span className="text-[#f0f5f0] font-500">{v}</span>
              </div>
            ))}
          </div>

          {/* Offer */}
          <div className="text-center py-6 border border-[#00e87a]/20 rounded-lg bg-[#00e87a]/5 mb-6">
            <div className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest mb-2">Rachat estimé</div>
            <div className="font-display font-800 text-5xl text-[#00e87a] mb-1">
              {estimate.min} $ – {estimate.max} $ CAD
            </div>
            <p className="text-[#6b7f6b] text-xs">Estimation indicative · Offre finale après inspection</p>
          </div>

          {/* Contact mini-form */}
          <div className="border border-[#1e2a1e] rounded-lg p-5 mb-5 bg-[#111811]">
            <div className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest mb-4">// Vos coordonnées pour accepter</div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Nom *</label>
                  <input
                    type="text"
                    placeholder="Jean Dupont"
                    value={contact.name}
                    onChange={(e) => updateContact('name')(e.target.value)}
                    className="bg-[#0a0f0d] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="06 00 00 00 00"
                    value={contact.phone}
                    onChange={(e) => updateContact('phone')(e.target.value)}
                    className="bg-[#0a0f0d] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Email *</label>
                <input
                  type="email"
                  placeholder="jean@exemple.fr"
                  value={contact.email}
                  onChange={(e) => updateContact('email')(e.target.value)}
                  className="bg-[#0a0f0d] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Message (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Informations complémentaires, disponibilité pour la collecte…"
                  value={contact.message}
                  onChange={(e) => updateContact('message')(e.target.value)}
                  className="bg-[#0a0f0d] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setStep('confirmed')
                sendEmail(
                  `[RachetPC] ✅ VENTE ACCEPTÉE — ${form.brand} ${form.model || ''} — ${estimate?.min}$–${estimate?.max}$ CAD`,
                  `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VENTE ACCEPTÉE — RACHETPC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 OFFRE ACCEPTÉE : ${estimate?.min} $ – ${estimate?.max} $ CAD

📞 COORDONNÉES DU CLIENT
  Nom        : ${contact.name}
  Courriel   : ${contact.email}
  Téléphone  : ${contact.phone || '—'}
  Message    : ${contact.message || '—'}

💻 APPAREIL
  Marque     : ${form.brand}
  Modèle     : ${form.model || '—'}
  Année      : ${form.year}
  État       : ${form.condition}
  Processeur : ${form.processor}
  RAM        : ${form.ram}
  Stockage   : ${form.storage} — ${form.storageType || '—'}
  GPU        : ${form.gpu || '—'}
  Écran      : ${form.screen}
  Batterie   : ${form.battery}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Action : contacter ${contact.name} au ${contact.email}${contact.phone ? ` / ${contact.phone}` : ''} pour organiser la collecte.
`.trim(),
                  contact.email,
                )
              }}
              disabled={!isContactValid}
              className={`w-full font-display font-700 text-base py-4 rounded transition-colors ${
                isContactValid
                  ? 'bg-[#00e87a] text-[#0a0f0d] hover:bg-[#00b85f]'
                  : 'bg-[#111811] text-[#2a3a2a] cursor-not-allowed border border-[#1e2a1e]'
              }`}
            >
              Accepter et vendre ✓
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep('negotiate')}
                className="font-display font-600 text-sm border border-[#00e87a]/40 text-[#00e87a] py-3 rounded hover:bg-[#00e87a]/10 transition-colors"
              >
                Négocier le prix ↗
              </button>
              <button
                onClick={() => setStep('declined')}
                className="font-display font-600 text-sm border border-[#1e2a1e] text-[#6b7f6b] py-3 rounded hover:border-[#2a3a2a] hover:text-[#f0f5f0] transition-colors"
              >
                Décliner
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[#6b7f6b] mt-3">Aucun engagement. Offre valable 7 jours.</p>
        </div>
      </ModalShell>
    )
  }

  // Form steps
  return (
    <ModalShell onClose={onClose}>
      <div className="p-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded flex items-center justify-center font-mono-label text-xs font-700 transition-colors ${formStep >= n ? 'bg-[#00e87a] text-[#0a0f0d]' : 'bg-[#111811] border border-[#1e2a1e] text-[#6b7f6b]'}`}>
                {n}
              </div>
              {n < 2 && <div className={`h-px w-12 transition-colors ${formStep > n ? 'bg-[#00e87a]' : 'bg-[#1e2a1e]'}`} />}
            </div>
          ))}
          <span className="font-mono-label text-xs text-[#6b7f6b] ml-2">Étape {formStep} sur 2</span>
        </div>

        {formStep === 1 && (
          <div className="flex flex-col gap-5">
            <div className="font-display font-700 text-2xl text-[#f0f5f0] mb-1">Informations générales</div>

            <div className="flex flex-col gap-2">
              <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Vous êtes</label>
              <div className="grid grid-cols-2 gap-3">
                {['Particulier', 'Entreprise'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update('sellerType')(t)}
                    className={`py-3 rounded border font-display font-500 transition-all ${
                      form.sellerType === t
                        ? 'border-[#00e87a] bg-[#00e87a]/10 text-[#00e87a]'
                        : 'border-[#1e2a1e] bg-[#0f160f] text-[#6b7f6b] hover:border-[#2a3a2a] hover:text-[#f0f5f0]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <SelectField label="Marque" value={form.brand} options={BRANDS} onChange={update('brand')} />
            <div className="flex flex-col gap-1.5">
              <label className="font-mono-label text-xs text-[#6b7f6b] uppercase tracking-widest">Modèle (optionnel)</label>
              <input
                type="text"
                placeholder="ex: MacBook Pro 14, ThinkPad X1 Carbon…"
                value={form.model}
                onChange={(e) => update('model')(e.target.value)}
                className="bg-[#0f160f] border border-[#1e2a1e] text-[#f0f5f0] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#00e87a] focus:ring-1 focus:ring-[#00e87a]/30 transition-colors placeholder:text-[#2a3a2a]"
              />
            </div>
            <SelectField label="Année d'achat" value={form.year} options={YEARS} onChange={update('year')} />
            <SelectField label="État général" value={form.condition} options={CONDITIONS} onChange={update('condition')} />

            <button
              onClick={() => setFormStep(2)}
              disabled={!isStep1Valid}
              className={`font-display font-700 text-base py-3.5 rounded transition-colors mt-2 ${
                isStep1Valid
                  ? 'bg-[#00e87a] text-[#0a0f0d] hover:bg-[#00b85f]'
                  : 'bg-[#111811] text-[#2a3a2a] cursor-not-allowed border border-[#1e2a1e]'
              }`}
            >
              Continuer →
            </button>
          </div>
        )}

        {formStep === 2 && (
          <div className="flex flex-col gap-5">
            <div className="font-display font-700 text-2xl text-[#f0f5f0] mb-1">Configuration technique</div>

            <SelectField label="Processeur" value={form.processor} options={PROCESSORS} onChange={update('processor')} />
            <SelectField label="Mémoire RAM" value={form.ram} options={RAM_OPTIONS} onChange={update('ram')} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Capacité stockage" value={form.storage} options={STORAGE_OPTIONS} onChange={update('storage')} />
              <SelectField label="Type de stockage" value={form.storageType} options={STORAGE_TYPES} onChange={update('storageType')} />
            </div>
            <SelectField label="Carte graphique" value={form.gpu} options={GPU_OPTIONS} onChange={update('gpu')} />
            <SelectField label="Taille d'écran" value={form.screen} options={SCREEN_OPTIONS} onChange={update('screen')} />
            <SelectField label="État de la batterie" value={form.battery} options={BATTERIES} onChange={update('battery')} />
            <CheckGroup
              label="Accessoires inclus"
              options={ACCESSORIES_LIST}
              selected={form.accessories}
              onChange={(v) => update('accessories')(v)}
            />

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setFormStep(1)}
                className="font-display font-600 border border-[#1e2a1e] text-[#6b7f6b] px-5 py-3.5 rounded hover:border-[#2a3a2a] hover:text-[#f0f5f0] transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={handleEstimate}
                disabled={!isStep2Valid}
                className={`flex-1 font-display font-700 text-base py-3.5 rounded transition-colors ${
                  isStep2Valid
                    ? 'bg-[#00e87a] text-[#0a0f0d] hover:bg-[#00b85f]'
                    : 'bg-[#111811] text-[#2a3a2a] cursor-not-allowed border border-[#1e2a1e]'
                }`}
              >
                Obtenir mon estimation ⚡
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  )
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0f0d]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f160f] border border-[#1e2a1e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b7f6b] hover:text-[#f0f5f0] transition-colors font-mono-label text-xl z-10"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [modalStep, setModalStep] = useState<Step>('idle')
  const [showContact, setShowContact] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const openEstimate = () => setModalStep('form')
  const closeModal = () => setModalStep('idle')

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-[#f0f5f0]">
      <Nav onEstimate={openEstimate} onContact={() => setShowContact(true)} />
      <Hero onEstimate={openEstimate} />
      <HowItWorks />
      <WhyUs />
      <FAQ />
      <SeoContent />
      <Footer
        onEstimate={openEstimate}
        onContact={() => setShowContact(true)}
        onLegal={() => setShowLegal(true)}
        onPrivacy={() => setShowPrivacy(true)}
      />

      {modalStep !== 'idle' && (
        <EstimationModal step={modalStep} setStep={setModalStep} onClose={closeModal} />
      )}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  )
}
