interface ImportMetaEnv {
  /** Formspree form ID (e.g. "xyzabcd"). Without it the contact form is replaced by an email link. */
  readonly PUBLIC_FORMSPREE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
