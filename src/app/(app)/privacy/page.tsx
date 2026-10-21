import type { Metadata } from "next";
import { LegalPage } from "@/core/shell/LegalPage";
import { config } from "@/core/config";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  const { owner, country, email } = config.legal;
  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" updated="21 October 2026">
      <section>
        <h2>Data controller</h2>
        <p>
          {owner}, {country}, is responsible for the personal data processed in {config.appName}. Contact: <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </section>
      <section>
        <h2>Without an account</h2>
        <p>
          If you use {config.appName} without signing in, everything you enter (sessions, tasks, settings) is stored only in your own browser. It is not sent to
          us.
        </p>
      </section>
      <section>
        <h2>With an account</h2>
        <ul>
          <li>
            <strong>Account:</strong> your email address and sign-in records, so you can log in. Legal basis: providing the service you asked for (GDPR art.
            6(1)(b)).
          </li>
          <li>
            <strong>Pro sync:</strong> if you have Pro, your sessions, tasks, activities and settings are stored on our servers so they can sync between your
            devices. Same legal basis.
          </li>
          <li>
            <strong>Payments:</strong> Stripe handles payments. We receive a customer reference, your subscription status and billing country, never your card
            number. We keep payment records for as long as bookkeeping law requires (art. 6(1)(c)).
          </li>
        </ul>
      </section>
      <section>
        <h2>Who processes data for us</h2>
        <ul>
          <li>Supabase: database and sign-in (hosted in the EU).</li>
          <li>Stripe: payments.</li>
          <li>Vercel: hosting the website.</li>
          <li>Our email provider: sending sign-in links.</li>
        </ul>
        <p className="mt-3">
          Each acts on our instructions under a data processing agreement. Where data leaves the EU/EEA, it is covered by the EU&apos;s standard contractual
          clauses or an adequacy decision.
        </p>
      </section>
      <section>
        <h2>Cookies and tracking</h2>
        <p>
          We use only the cookies needed to keep you signed in, and your browser&apos;s local storage to save your work. There are no ads, no analytics trackers
          and no selling of data.
        </p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>
          Account and synced data are kept until you delete your account; email us and we&apos;ll erase it within 30 days. Payment records are kept for the
          period bookkeeping law requires.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You can ask for access to, correction, deletion or a copy of your data, and object to or restrict its processing. Most of it you can export yourself
          from Settings → Data. If you think we handle your data wrongly, you can complain to the Danish Data Protection Agency,{" "}
          <a href="https://www.datatilsynet.dk" target="_blank" rel="noreferrer">
            Datatilsynet
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
