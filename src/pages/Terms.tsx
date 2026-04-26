// TODO: Replace placeholder with full legal copy before Q3 scaling.
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 md:px-8">
      <article className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Terms &amp; Conditions
          </h1>
        </header>

        <p className="text-base leading-relaxed text-foreground">
          These terms govern your use of MtaaLoop. Full legal terms are being
          finalised. For questions, contact{" "}
          <a
            href="mailto:support@mtaaloop.com"
            className="text-primary font-semibold underline"
          >
            support@mtaaloop.com
          </a>
          .
        </p>
      </article>
    </main>
  );
}
