import PostLayout from '../../components/PostLayout';

export default function FromDocsToRunnableCode() {
  return (
    <PostLayout
      kicker="Tooling · Developer Experience"
      title={<>From Docs to<br /><em>Runnable Code in One Command</em></>}
      lede="A reference implementation in a doc proves a pattern reads well. It doesn't prove anyone can actually reproduce it under deadline. The real test is whether a brand-new domain, generated from nothing but a name, passes every automated check the very first time."
      date="2026.07.22"
      readMinutes={12}
    >
      <p>This repo's <code>docs/reference.md</code> defines a practical implementation template — a small worked example (historically, an Order domain) showing every layer, every file, every naming convention in one place. A written template is useful right up until someone has to actually type it all out correctly for the fifth new domain in a row. The next step was turning that template into a generator: a script that takes just a domain name and produces real, harness-passing code.</p>
      <h2>What Gets Generated, in One Pass</h2>
      <p>Running the generator against a brand-new domain name produces, in one shot, an Aggregate with a single state field cycling through <code>PENDING</code>/<code>ACTIVE</code>/<code>CANCELLED</code>, CQRS Command and Query Handlers wired to a Command Bus and Query Bus, one Domain Event, a Repository (interface plus implementation), a Controller and DTOs, and a Module wiring it all together:</p>
      <pre><code>{`# Default: generates under ../examples/src/<domain>/, leaves app-module.ts untouched and
# only prints the import/registration snippet to paste in
node scripts/create-domain.js Coupon

# Passing --wire also auto-inserts the import/registration into app-module.ts
node scripts/create-domain.js Coupon --wire

# To generate into a different project (e.g. one cloned from this repo as a template), specify --out
node scripts/create-domain.js Coupon --out /path/to/other-project/src --wire`}</code></pre>
      <p>What comes out is deliberately a skeleton, not a finished feature — an empty CRUD-style starting point. The actual business rules, error messages, and domain-specific fields still need to be filled in by hand. What the generator buys isn't "you never write domain logic again" — it's "you never have to remember, by hand, all thirty-some small conventions (file naming, layer placement, Repository method names, the Outbox registration call) that a from-scratch domain needs to pass the harness on day one."</p>
      <h2>The Verification That Actually Matters</h2>
      <p>A generator that produces plausible-looking code isn't the same as a generator that produces code passing every rule the harness checks. Confirming that gap is closed means generating a domain nobody's ever used before — one entirely unrelated to the existing example domains — and running the harness against it for real:</p>
      <pre><code>{`node scripts/create-domain.js Coupon --wire
bash harness.sh <projectRoot>
# → A (100/100)`}</code></pre>
      <p>This was tested against multiple-word and irregular-plural domain names specifically because that's where a naive code generator tends to break first — a pluralization rule based on simple suffix rules (+s, +es, y→ies) handles <code>Coupon</code> → <code>coupons</code> fine but needs manual touch-up for something like a domain whose plural doesn't follow that pattern. Confirming the generator scores 100/100 against domains it was never specifically tuned for is what actually validates that the docs and the tool agree — not a single successful run against the one example the generator's author had in mind while writing it.</p>
      <h2>The Recurring Bug Class: The Generator Falls Behind the Rules It's Supposed to Satisfy</h2>
      <p>The single most common failure mode across every language's generator, discovered repeatedly across unrelated feature rounds: a new harness rule gets added — a naming convention, a request-context pattern, an Outbox structural change — the manual example code gets updated to comply, and the generator quietly keeps emitting the old pattern, because nobody re-ran it after the rule changed.</p>
      <p>This happened concretely more than once. When a Repository method-naming rule was introduced (unifying scattered patterns into <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>), two separate language generators were found — during an unrelated benchmark run, not a dedicated audit — to still be producing the violating shape. When the request-scoped user-context pattern replaced direct request-object access, the generator needed its own follow-up fix, separate from the example code's fix, because the two aren't the same artifact and updating one doesn't touch the other. The same thing happened again when the Outbox pattern moved from a single-pass drain to a multi-pass one across all five languages: every generator needed the identical structural fix as the hand-written example, as a second, distinct commit.</p>
      <div className="article-note"><strong>The pattern behind all of these</strong><p>A generator is itself a second implementation of every convention it emits, maintained separately from the code it's copying the shape of. Any process that updates a rule and the example without also asking "does the generator still produce this?" will drift, reliably, every single time — not occasionally.</p></div>
      <h2>A Bug the Generator Itself Introduced</h2>
      <p>Generators aren't just at risk of falling behind rules — they can also carry their own independent defects that the manual example never had, because the templating logic is a separate piece of code with its own bugs. One generator's scaffolded "cancel" handler was found to be missing a mapping for an already-cancelled state — a real gap that would have silently produced a generic 500 error instead of the correct 400, for every single domain generated with that tool until it was found and fixed. That's not a documentation drift issue at all; it's a bug in the code that writes code, and it only surfaces by actually generating something and exercising the unhappy path, not by reading the generator's source.</p>
      <h2>Why This Is Worth the Maintenance Cost</h2>
      <p>Every language in this repo ended up with its own version of this tool, each idiomatic to that ecosystem — a Node script for NestJS, a standalone Go module using <code>go run .</code> since Go has no natural place to hang scaffolding scripts off an existing module, a Python script for the two Spring Boot ports (deliberately Python rather than requiring the Java/Gradle toolchain to boot just to scaffold a file), and one for FastAPI. All five follow the identical contract: take a domain name, optionally a <code>--wire</code> flag to auto-register the new domain instead of just printing the snippet to paste in, and an <code>--out</code> flag to target a different project entirely — useful for treating this repo as a template to bootstrap a brand-new service from, not just as a reference to copy by hand.</p>
      <p>The generator earns its keep twice over: once as a genuine productivity tool for scaffolding a real new domain, and once as a running regression test for the docs themselves — every time it's re-run against a name nobody's used before and re-verified against the harness, it's really asking "do the documented conventions and the tool that's supposed to embody them still agree with each other." That question turned out to need re-asking more often than expected.</p>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/reference.md" target="_blank" rel="noreferrer">docs/reference.md</a> — the reference implementation template every generator is built from · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations/nestjs/scripts" target="_blank" rel="noreferrer">implementations/nestjs/scripts/create-domain.js</a> — the NestJS generator's real source
      </p></div>
    </PostLayout>
  );
}
