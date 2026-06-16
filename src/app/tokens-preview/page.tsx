'use client';

/**
 * THROWAWAY preview — Visual System V1 P3 verification only.
 *
 * Renders the `ui/` primitives and the semantic token swatches in BOTH modes
 * (product/dark via `.theme-product`, website/light via `.theme-website`) so we
 * can eyeball that primitives flip correctly off one token set.
 *
 * DELETE at the end of Visual System V1 (decision §11.3). Not linked from
 * anywhere; reachable only at /__tokens.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

function Swatch({ name, className }: { name: string; className: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-8 w-8 rounded border border-border ${className}`} />
      <code className="text-t6 text-fg-muted">{name}</code>
    </div>
  );
}

function Showcase({ title }: { title: string }): React.ReactElement {
  return (
    <div className="min-h-screen space-y-8 bg-background p-8 text-fg">
      <header className="space-y-1">
        <h1 className="font-heading text-t1 text-fg">{title}</h1>
        <p className="text-t5 text-fg-muted">UmojaHub Visual System V1 — primitive &amp; token preview</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-t3 text-fg">Surfaces</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Swatch name="bg" className="bg-background" />
          <Swatch name="surface" className="bg-surface" />
          <Swatch name="surface-raised" className="bg-surface-raised" />
          <Swatch name="surface-sunken" className="bg-surface-sunken" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-t3 text-fg">Text</h2>
        <p className="text-fg">Primary foreground — the quick brown fox jumps over the lazy dog.</p>
        <p className="text-fg-muted">Muted foreground — the quick brown fox jumps over the lazy dog.</p>
        <p className="text-fg-subtle">Subtle foreground — the quick brown fox jumps over the lazy dog.</p>
        <p className="text-brand-text">Brand text accent — the quick brown fox jumps over the lazy dog.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-t3 text-fg">Brand &amp; state</h2>
        <div className="flex flex-wrap gap-3">
          <Swatch name="brand" className="bg-brand" />
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="danger" className="bg-danger" />
          <Swatch name="info" className="bg-info" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-t3 text-fg">Buttons (focus-visible to verify ring)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-t3 text-fg">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" label="VERIFIED" />
          <Badge variant="warning" label="UNDER REVIEW" />
          <Badge variant="error" label="DENIED" />
          <Badge variant="neutral" label="NEW" />
        </div>
      </section>

      <section className="max-w-sm space-y-3">
        <h2 className="text-t3 text-fg">Input &amp; card</h2>
        <Input label="Email" placeholder="you@example.com" />
        <Input label="With error" error="This field is required" placeholder="…" />
        <Card variant="standard">
          <p className="text-fg">Standard card</p>
          <p className="text-t5 text-fg-muted">Body text inside a surface card.</p>
        </Card>
      </section>
    </div>
  );
}

export default function TokensPreviewPage(): React.ReactElement {
  return (
    <main>
      <div className="theme-product">
        <Showcase title="Product mode (dark)" />
      </div>
      <div className="theme-website">
        <Showcase title="Website mode (light)" />
      </div>
    </main>
  );
}
