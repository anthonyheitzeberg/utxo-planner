<template>
  <footer
    class="border-t border-border bg-panel dark:border-border-dark dark:bg-panel-dark"
  >
    <div
      class="mx-auto grid w-[min(100%-2rem,72rem)] gap-8 py-10 sm:grid-cols-3"
    >
      <section aria-labelledby="footer-about">
        <h2
          id="footer-about"
          class="font-semibold text-content dark:text-content-dark"
        >
          About
        </h2>
        <p class="mt-3 text-sm leading-6 text-muted dark:text-muted-dark">
          UTXO Planner is an open-source project in development. Landing-page
          copy is placeholder text.
        </p>
      </section>
      <section aria-labelledby="footer-boundaries">
        <h2
          id="footer-boundaries"
          class="font-semibold text-content dark:text-content-dark"
        >
          What this isn't
        </h2>
        <p class="mt-3 text-sm leading-6 text-muted dark:text-muted-dark">
          Not financial advice and not a wallet. It does not sign or broadcast
          transactions, and it never handles keys.
        </p>
      </section>
      <section aria-labelledby="footer-contact">
        <h2
          id="footer-contact"
          class="font-semibold text-content dark:text-content-dark"
        >
          Found an error?
        </h2>
        <p class="mt-3 text-sm leading-6 text-muted dark:text-muted-dark">
          <a
            class="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary dark:text-primary-dark dark:decoration-primary-dark/50"
            href="https://github.com/anthonyheitzeberg/utxo-planner/issues"
            rel="noreferrer"
            target="_blank"
            >Report it on GitHub</a
          >. The project is intended to run in your browser; no analytics or
          cookies are used.
        </p>
      </section>
    </div>
    <div
      class="border-t border-border px-4 py-4 text-center dark:border-border-dark"
    >
      <p class="text-sm font-medium text-positive dark:text-positive-dark">
        This tool never asks for keys. It runs in your browser.
      </p>
      <p class="mt-2 text-xs text-muted dark:text-muted-dark">
        Open source · MIT license file and citation details are still to be
        added.
      </p>
    </div>
  </footer>
</template>
