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

/* ── Project inquiry form (Work with me page) ─────────────────────────────── */

export const SOLUTION_TYPES = [
  "AI workflow automation",
  "AI agents",
  "RAG and knowledge systems",
  "Data pipelines",
  "API integrations",
  "AI consulting",
  "Other",
] as const;

export const TIMELINES = ["As soon as possible", "Within a month", "1–3 months", "Just exploring"] as const;

export const BUDGETS = ["Not sure yet", "Under ₹50,000", "₹50,000 – ₹2,00,000", "Over ₹2,00,000"] as const;

export const INQUIRY_LIMITS = {
  company: { max: 120 },
  website: { max: 200 },
  problem: { min: 30, max: 4000 },
  tools: { max: 500 },
} as const;

export type InquiryField =
  "name" | "email" | "company" | "website" | "problem" | "solutionType" | "tools" | "budget" | "timeline";
export type InquiryInput = Record<InquiryField, string>;
export type InquiryErrors = Partial<Record<InquiryField, string>>;

// A domain with an optional scheme and path, e.g. "acme.in" or "https://www.acme.com/about".
const WEBSITE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export function validateInquiry(input: InquiryInput): InquiryErrors {
  const base = validateContact({ name: input.name, email: input.email, message: "x".repeat(LIMITS.message.min) });
  const errors: InquiryErrors = {};
  if (base.name) errors.name = base.name;
  if (base.email) errors.email = base.email.replace("name@company.com", "you@company.com");

  const company = input.company.trim();
  if (!company) errors.company = "Please enter your company or organisation (or “Independent”).";
  else if (company.length > INQUIRY_LIMITS.company.max)
    errors.company = `Please keep this under ${INQUIRY_LIMITS.company.max} characters.`;

  const website = input.website.trim();
  if (website && (website.length > INQUIRY_LIMITS.website.max || !WEBSITE.test(website)))
    errors.website = "Please enter a website like acme.com, or leave it empty.";

  const problem = input.problem.trim();
  if (!problem) errors.problem = "Please describe the problem you want to solve.";
  else if (problem.length < INQUIRY_LIMITS.problem.min)
    errors.problem = `Please add a little more detail (at least ${INQUIRY_LIMITS.problem.min} characters).`;
  else if (problem.length > INQUIRY_LIMITS.problem.max)
    errors.problem = `Please keep this under ${INQUIRY_LIMITS.problem.max} characters.`;

  if (!(SOLUTION_TYPES as readonly string[]).includes(input.solutionType))
    errors.solutionType = "Please choose the type of solution you need.";

  if (input.tools.trim().length > INQUIRY_LIMITS.tools.max)
    errors.tools = `Please keep this under ${INQUIRY_LIMITS.tools.max} characters.`;

  if (input.budget && !(BUDGETS as readonly string[]).includes(input.budget))
    errors.budget = "Please choose a budget range.";

  if (!(TIMELINES as readonly string[]).includes(input.timeline)) errors.timeline = "Please choose a timeline.";

  return errors;
}
