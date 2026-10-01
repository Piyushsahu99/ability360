import { auth, defineMcp } from "@lovable.dev/mcp-js";

import careerRoles from "./tools/career-roles";
import myApplications from "./tools/my-applications";
import myGoals from "./tools/my-goals";
import opportunities from "./tools/opportunities";

const projectId = (import.meta.env["VITE_SUPABASE_PROJECT_ID"] as string | undefined) ?? "project-ref-unset";

export default defineMcp({
  name: "ability-360",
  title: "Ability 360",
  version: "0.1.0",
  instructions:
    "ABILITY360 is an Indian academia-to-industry career platform for college students. Use these tools to search opportunities and career roles, and to read the signed-in student's own applications and goals. Salaries are in LPA (lakhs of rupees per annum).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectId}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [opportunities, careerRoles, myApplications, myGoals],
});
