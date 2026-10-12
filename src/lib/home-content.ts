import type { Opportunity } from "@/lib/opportunities";
import type { ResourceRow } from "@/lib/resources";

export type HomeHighlight =
  | { kind: "opportunity"; date: string | null; item: Opportunity }
  | { kind: "resource"; date: string | null; item: ResourceRow };

function activeDate(value: string | null, now: Date) {
  if (!value) return true;
  return new Date(value).getTime() >= now.getTime();
}

export function selectPwdHighlights(
  opportunities: Opportunity[],
  resources: ResourceRow[],
  now = new Date(),
  limit = 4,
): HomeHighlight[] {
  const opportunityHighlights: HomeHighlight[] = opportunities
    .filter((item) => item.is_published && item.is_inclusive_employer && activeDate(item.deadline, now))
    .map((item) => ({ kind: "opportunity", date: item.deadline, item }));

  const resourceHighlights: HomeHighlight[] = resources
    .filter((item) => item.is_published && item.category === "divyangjan" && activeDate(item.expires_at, now))
    .map((item) => ({ kind: "resource", date: item.expires_at, item }));

  return [...opportunityHighlights, ...resourceHighlights]
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, limit);
}

export function closesSoon(value: string | null, now = new Date(), days = 21) {
  if (!value) return false;
  const remaining = new Date(value).getTime() - now.getTime();
  return remaining >= 0 && remaining <= days * 24 * 60 * 60 * 1000;
}

export type GovernmentPlatform = {
  name: string;
  shortName: string;
  description: string;
  href: string;
  category: "Identity & rights" | "Education & scholarships" | "Employment & skilling" | "Assistive support" | "Sign language & learning";
};

export const governmentPlatforms: GovernmentPlatform[] = [
  {
    name: "Department of Empowerment of Persons with Disabilities",
    shortName: "DEPwD",
    description: "National policies, schemes, acts and disability services.",
    href: "https://depwd.gov.in/",
    category: "Identity & rights",
  },
  {
    name: "Unique Disability ID",
    shortName: "UDID",
    description: "Apply for and track a disability certificate and UDID card.",
    href: "https://www.swavlambancard.gov.in/",
    category: "Identity & rights",
  },
  {
    name: "Chief Commissioner for Persons with Disabilities",
    shortName: "CCPD",
    description: "Rights information, complaints and statutory guidance.",
    href: "https://ccpd.nic.in/",
    category: "Identity & rights",
  },
  {
    name: "National Scholarship Portal",
    shortName: "NSP",
    description: "Search and apply for eligible central scholarship schemes.",
    href: "https://scholarships.gov.in/",
    category: "Education & scholarships",
  },
  {
    name: "National Handicapped Finance and Development Corporation",
    shortName: "NHFDC",
    description: "Education loans, skill training and self-employment support.",
    href: "https://www.nhfdc.nic.in/",
    category: "Education & scholarships",
  },
  {
    name: "National Career Service",
    shortName: "NCS",
    description: "Government job search, career guidance and counselling services.",
    href: "https://www.ncs.gov.in/",
    category: "Employment & skilling",
  },
  {
    name: "Skill Council for Persons with Disability",
    shortName: "SCPwD",
    description: "Disability-inclusive vocational training and skill pathways.",
    href: "https://www.scpwd.in/",
    category: "Employment & skilling",
  },
  {
    name: "Artificial Limbs Manufacturing Corporation of India",
    shortName: "ALIMCO",
    description: "ADIP information and assistive-device services.",
    href: "https://alimco.in/",
    category: "Assistive support",
  },
  {
    name: "Indian Sign Language Research and Training Centre",
    shortName: "ISLRTC",
    description: "Indian Sign Language learning, dictionaries and training.",
    href: "https://islrtc.nic.in/",
    category: "Sign language & learning",
  },
];