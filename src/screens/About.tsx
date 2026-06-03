import { useEffect, useState } from 'react';
import { Sheet } from '../components/Sheet';
import { api } from '../lib/api';
import type { Manifest } from '../lib/types';

const FALLBACK_ATTRIBUTION = [
  "Strong's dictionaries: OpenScriptures, CC-BY-SA (public-domain Strong's text).",
  'Tagged text & morphology: STEPBible / Tyndale House Cambridge, CC-BY 4.0.',
];

export function About({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    if (open && !manifest) api.manifest().then(setManifest).catch(() => {});
  }, [open, manifest]);

  const attribution = manifest?.attribution ?? FALLBACK_ATTRIBUTION;

  return (
    <Sheet open={open} onClose={onClose} title="About">
      <div className="space-y-5 text-[0.95rem] leading-relaxed">
        <p className="font-serif">
          Verse Exegesis is a semantic scripture search and study tool. Ask any question and it
          surfaces relevant NASB1995 passages. Tap any word in a verse to study the original Hebrew
          or Greek — Strong’s number, root, morphology, definition and usage — and tap any English
          word in a menu to trace its etymology.
        </p>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Data &amp; attribution
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            {attribution.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {manifest ? (
          <p className="text-sm text-muted">
            {manifest.books.length} books · {manifest.lexiconEntries.toLocaleString()} lexicon
            entries · {manifest.morphCodes.toLocaleString()} morphology codes bundled.
          </p>
        ) : null}

        <p className="text-sm text-muted">
          Verse text is generated on demand and is not stored by this app. Scripture quotations are
          from the New American Standard Bible® (NASB), © The Lockman Foundation.
        </p>
      </div>
    </Sheet>
  );
}
