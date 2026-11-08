import { site } from "./site";
import skills from "../content/skills.json";
import education from "../content/education.json";
import type { Project } from "./projects";

const base = () => site.url.replace(/\/$/, "");

/** schema.org Person for the home page. Only confirmed facts; no employer (worksFor) by design. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${base()}/#person`,
    name: site.name,
    url: `${base()}/`,
    jobTitle: "Forward Deployed Engineer",
    description: site.tagline,
    email: `mailto:${site.links.email}`,
    sameAs: [site.links.github, site.links.linkedin],
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
    alumniOf: education.degrees.map((d) => ({ "@type": "CollegeOrUniversity", name: d.institution })),
    knowsAbout: skills.groups.flatMap((g) => g.items).slice(0, 20),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base()}/#website`,
    url: `${base()}/`,
    name: site.name,
    author: { "@id": `${base()}/#person` },
  };
}

/** schema.org CreativeWork for a case study page. */
export function projectJsonLd(project: Project) {
  const { data } = project;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${data.name}: ${data.title}`,
    headline: data.title,
    description: data.summary,
    url: `${base()}/projects/${project.id}/`,
    dateModified: data.updated.toISOString().slice(0, 10),
    author: { "@type": "Person", "@id": `${base()}/#person`, name: site.name },
    keywords: [...data.types, ...data.tech].join(", "),
    ...(data.links.github ? { isBasedOn: data.links.github } : {}),
    ...(data.links.demo ? { workExample: { "@type": "WebApplication", name: data.name, url: data.links.demo } } : {}),
  };
}

/** JSON for a <script type="application/ld+json"> block. "<" is escaped so the text can never close the tag. */
export function toJsonLd(data: unknown): string {
  const backslash = String.fromCharCode(92);
  return JSON.stringify(data).replaceAll("<", `${backslash}u003c`);
}
