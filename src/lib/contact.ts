/** Contact-form rules, shared by the browser script and the unit tests. */

export const LIMITS = { name: { min: 2, max: 100 }, message: { min: 20, max: 4000 }, email: { max: 254 } } as const;

export type Field = "name" | "email" | "message";
export type ContactInput = Record<Field, string>;
export type Errors = Partial<Record<Field, string>>;

// Pragmatic email check: one @, no spaces, a dot in the domain, no dot at either end of the domain.
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function validateContact(input: ContactInput): Errors {
  const errors: Errors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name) errors.name = "Please enter your name.";
  else if (name.length < LIMITS.name.min) errors.name = `Your name needs at least ${LIMITS.name.min} characters.`;
  else if (name.length > LIMITS.name.max) errors.name = `Please keep your name under ${LIMITS.name.max} characters.`;

  if (!email) errors.email = "Please enter your email address.";
  else if (email.length > LIMITS.email.max || !EMAIL.test(email))
    errors.email = "Please enter a valid email address, like name@company.com.";

  if (!message) errors.message = "Please write a message.";
  else if (message.length < LIMITS.message.min)
    errors.message = `Please write a little more (at least ${LIMITS.message.min} characters).`;
  else if (message.length > LIMITS.message.max)
    errors.message = `Please keep your message under ${LIMITS.message.max} characters.`;

  return errors;
}

export const FORMSPREE_ID_PATTERN = /^[A-Za-z0-9]{6,12}$/;

/** The Formspree endpoint, or null when no valid form ID is configured. */
export function formspreeEndpoint(id: string | undefined): string | null {
  return id && FORMSPREE_ID_PATTERN.test(id) ? `https://formspree.io/f/${id}` : null;
}
