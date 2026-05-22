'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Braces,
  Code,
  Wand2,
  Minimize2,
  CheckCircle2,
  ArrowRightLeft,
  ArrowRight,
  Network,
  Table,
  GitCompare,
  Upload,
  Download,
  Quote,
  Sparkles,
  Shield,
  Zap,
  Gauge,
  Github,
  ArrowDown,
} from 'lucide-react'

const features = [
  {
    icon: Braces,
    title: 'Format & Beautify',
    description: 'Instantly format messy JSON into clean, readable output with proper indentation.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    large: true,
  },
  {
    icon: Minimize2,
    title: 'Minify & Compress',
    description: 'Strip whitespace and compress JSON to minimal size for production use.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: ArrowRightLeft,
    title: 'Format Conversion',
    description: 'Convert between JSON, XML, and YAML with a single click.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CheckCircle2,
    title: 'Validate & Auto-Fix',
    description: 'Validate syntax instantly and auto-repair common JSON errors.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Network,
    title: 'Tree & Graph Views',
    description: 'Visualize complex structures as interactive trees and relationship graphs.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Table,
    title: 'Table View & CSV Export',
    description: 'View arrays as sortable tables and export to CSV for spreadsheet analysis.',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  {
    icon: GitCompare,
    title: 'Diff Comparison',
    description: 'Side-by-side diff view to compare input and output with highlighted changes.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Wand2,
    title: 'Smart Extraction',
    description: 'Paste cURL, Base64, or log snippets — auto-extract the JSON inside.',
    color: 'text-fuchsia-500',
    bg: 'bg-fuchsia-500/10',
  },
  {
    icon: Quote,
    title: 'Escape & Unescape',
    description: 'Escape special characters for embedding, or reverse it instantly.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
]

const highlights = [
  { icon: Shield, label: '100% Local', desc: 'Processing happens in your browser — data never leaves your machine' },
  { icon: Zap, label: 'Instant Results', desc: 'Real-time formatting with auto mode for zero-click productivity' },
  { icon: Gauge, label: 'Monaco Engine', desc: 'Same editor powering VS Code — syntax highlighting, multi-cursor' },
]

const jsonLines = [
  ['{'],
  ['  ', ['"name"', ': ', '"JSON Workbench"', ',']],
  ['  ', ['"version"', ': ', '"1.0.0"', ',']],
  ['  ', ['"privacy"', ': ', 'true', ',']],
  ['  ', ['"features"', ': ', '[']],
  ['    ', ['"format"', ',']],
  ['    ', ['"validate"', ',']],
  ['    ', ['"convert"', ',']],
  ['    ', ['"visualize"']],
  ['  ', ']'],
  ['}'],
]

function CodePreview() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 rounded-2xl blur-xl motion-safe:animate-pulse" />
      <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-10 border-b bg-muted/30">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-[11px] text-muted-foreground font-medium">input.json</span>
          </div>
        </div>
        <div className="p-5 font-mono text-sm leading-relaxed bg-card">
          {jsonLines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-muted-foreground/30 select-none w-5 text-right mr-4 shrink-0 tabular-nums">
                {i + 1}
              </span>
              <span>
                {typeof line === 'string' ? (
                  <span className="text-amber-500 dark:text-amber-400">{line}</span>
                ) : (
                  <>
                    {line[0]}
                    {Array.isArray(line[1]) ? (
                      <>
                        <span className="text-sky-500 dark:text-sky-400">{line[1][0]}</span>
                        {line[1].slice(1).map((part, j) => (
                          <span key={j}>{part}</span>
                        ))}
                      </>
                    ) : (
                      <>
                        <span className="text-sky-500 dark:text-sky-400">{line[1]}</span>
                        {line.slice(2).map((part, j) => (
                          <span key={j}>{part}</span>
                        ))}
                      </>
                    )}
                  </>
                )}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1 mt-3">
            <div className="w-2 h-4 bg-amber-500 rounded-sm motion-safe:animate-pulse" aria-hidden="true" />
            <span className="text-[11px] text-muted-foreground/50">Ln 11, Col 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl" role="navigation" aria-label="Main navigation">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            aria-label="JSON Workbench home"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background transition-colors duration-200">
              <Braces className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-semibold text-sm tracking-tight font-[family-name:var(--font-display)]">
              JSON Workbench
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Ryanstarmoon/json-util-web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
              aria-label="View source on GitHub"
            >
              <Github className="w-5 h-5" aria-hidden="true" />
            </a>
            <Link href="/workbench">
              <Button size="sm" className="h-8 text-xs font-medium cursor-pointer">
                Launch App
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-b from-amber-500/[0.06] via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-blue-500/[0.06] via-transparent to-transparent blur-3xl" />
          <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-purple-500/[0.04] via-transparent to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-xs font-medium text-muted-foreground mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                Free &amp; Open Source
              </div>

              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)] leading-[1.08]"
              >
                The JSON toolkit
                <br />
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  that stays local.
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                Format, validate, convert, and visualize JSON, XML, and YAML — all in your browser.
                No uploads, no servers, no compromises on privacy.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/workbench">
                  <Button size="lg" className="h-11 px-6 font-medium gap-2 cursor-pointer">
                    Open Workbench
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/Ryanstarmoon/json-util-web"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className="h-11 px-6 font-medium gap-2 cursor-pointer">
                    <Github className="w-4 h-4" aria-hidden="true" />
                    View on GitHub
                  </Button>
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                {highlights.map((h) => (
                  <div key={h.label} className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted" aria-hidden="true">
                      <h.icon className="w-4 h-4 text-foreground/60" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{h.label}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight">{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Code Preview */}
            <div className="hidden lg:block">
              <CodePreview />
            </div>
          </div>
        </div>
      </section>

      {/* Supported Formats Bar */}
      <section className="border-y bg-muted/20" aria-label="Supported formats">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-center gap-8 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Supports</span>
          {[
            { label: 'JSON', color: 'bg-amber-500' },
            { label: 'XML', color: 'bg-blue-500' },
            { label: 'YAML', color: 'bg-purple-500' },
            { label: 'CSV', color: 'bg-emerald-500' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${f.color}`} aria-hidden="true" />
              <span className="text-sm font-semibold font-[family-name:var(--font-display)]">{f.label}</span>
            </div>
          ))}
          <span className="text-[11px] text-muted-foreground">+ Base64, cURL, URL-encoded</span>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="features-heading">
        <div className="text-center mb-14">
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]"
          >
            Everything you need for JSON
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            A complete toolkit built for developers who work with structured data every day.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => {
            const isFirst = i === 0
            return (
              <div
                key={f.title}
                className={`group relative p-5 sm:p-6 rounded-xl border bg-card hover:border-foreground/10 hover:shadow-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isFirst ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${f.bg} mb-4 transition-transform duration-200 group-hover:scale-105`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5 font-[family-name:var(--font-display)]">{f.title}</h3>
                <p className={`text-sm text-muted-foreground leading-relaxed ${isFirst ? 'max-w-lg' : ''}`}>{f.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/10" aria-label="Key statistics">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { value: '100%', label: 'Client-Side Processing' },
              { value: '4', label: 'Input/Output Formats' },
              { value: '0', label: 'Data Ever Uploaded' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28" aria-labelledby="workflow-heading">
        <div className="text-center mb-14">
          <h2
            id="workflow-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]"
          >
            Simple workflow, powerful results
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            From raw data to polished output in three steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { step: '01', icon: Upload, title: 'Paste or Import', desc: 'Paste JSON directly, upload a file, or let smart extraction pull it from cURL and logs.' },
            { step: '02', icon: Wand2, title: 'Process & Transform', desc: 'Format, minify, validate, fix, or convert between JSON, XML, and YAML instantly.' },
            { step: '03', icon: Download, title: 'Copy or Export', desc: 'Copy the result to clipboard or download as a file — ready for your next task.' },
          ].map((w) => (
            <div key={w.step} className="relative text-center p-6">
              <div className="text-[10px] font-bold text-muted-foreground/40 tracking-widest mb-3">{w.step}</div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4" aria-hidden="true">
                <w.icon className="w-6 h-6 text-foreground/60" />
              </div>
              <h3 className="font-semibold text-sm mb-2 font-[family-name:var(--font-display)]">{w.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20 sm:pb-28" aria-labelledby="cta-heading">
        <div className="relative rounded-2xl overflow-hidden border bg-card">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.08] to-rose-500/[0.08]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.06] via-transparent to-transparent" aria-hidden="true" />
          <div className="relative p-10 sm:p-14 text-center">
            <h2
              id="cta-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]"
            >
              Ready to wrangle some JSON?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              No sign-up, no uploads, no limits. Just open the workbench and start.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/workbench">
                <Button size="lg" className="h-12 px-8 font-medium gap-2 text-sm cursor-pointer">
                  Launch Workbench
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Button>
              </Link>
              <a
                href="https://github.com/Ryanstarmoon/json-util-web"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="h-12 px-6 font-medium gap-2 text-sm cursor-pointer">
                  <Github className="w-4 h-4" aria-hidden="true" />
                  Star on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Braces className="w-4 h-4" aria-hidden="true" />
            <span>JSON Workbench</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Ryanstarmoon/json-util-web"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              GitHub
            </a>
            <span className="text-border select-none" aria-hidden="true">|</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
