import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/core/shell/LegalPage";
import { config } from "@/core/config";
import { PRICING } from "@/core/billing/plans";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  const { owner, country, email } = config.legal;
  return (
    <LegalPage eyebrow="Legal" title="Terms of use" updated="21 October 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          {config.appName} is run by {owner}, {country}. You can reach us at <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </section>
      <section>
        <h2>The service</h2>
        <p>
          {config.appName} is a focus timer with task lists and insights into how you spend your time. Using it requires a free account. Pro adds
          the features listed on the <Link href="/pricing">pricing page</Link>.
        </p>
      </section>
      <section>
        <h2>Pro subscriptions</h2>
        <ul>
          <li>
            Pro costs {PRICING.symbol}
            {PRICING.monthly} per month or {PRICING.symbol}
            {PRICING.yearly} per year. The price shown at checkout is the price you pay, including any VAT.
          </li>
          <li>Payments are processed by Stripe. We never see or store your card details.</li>
          <li>
            Your subscription renews automatically until you cancel. You can cancel anytime from Account → Billing; Pro stays active until the end of the period
            you paid for.
          </li>
          <li>
            If you&apos;re not happy within 14 days of your first payment, email us and we&apos;ll refund it in full. This is in addition to your statutory
            rights as a consumer in the EU.
          </li>
          <li>If we change the price, we&apos;ll tell you by email at least 30 days before it affects your next renewal.</li>
        </ul>
      </section>
      <section>
        <h2>Your data</h2>
        <p>
          What you log in {config.appName} belongs to you. You can export it at any time from Settings → Data. How we handle personal data is described in the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
      <section>
        <h2>Fair use</h2>
        <p>
          Don&apos;t try to break, overload or get unauthorised access to the service, and don&apos;t use it for anything unlawful. We may close accounts that
          do.
        </p>
      </section>
      <section>
        <h2>Availability and liability</h2>
        <p>
          We work to keep {config.appName} running and your data safe, but the service is provided as it is, without guarantees of uninterrupted availability.
          Keep a backup of anything important (Settings → Data). To the extent the law allows, our liability is limited to the amount you paid us in the 12
          months before the claim.
        </p>
      </section>
      <section>
        <h2>Changes and law</h2>
        <p>
          We may update these terms; significant changes will be announced on the site or by email. These terms are governed by the laws of {country}. Nothing
          here limits rights you have as a consumer under mandatory law.
        </p>
      </section>
    </LegalPage>
  );
}
