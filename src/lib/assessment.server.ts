import type { Database } from "@/integrations/supabase/types";

export type SkillCategory = Database["public"]["Enums"]["skill_category"];
export type SubmittedAnswer = { questionId: string; choice: number };

export function scoreToLevel(score: number) {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
}

export async function gradeAttempt(
  userId: string,
  category: SkillCategory,
  answers: SubmittedAnswer[],
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const ids = answers.map((a) => a.questionId);
  const { data: questions, error } = await supabaseAdmin
    .from("assessment_questions")
    .select("id, category, topic, correct_index")
    .in("id", ids)
    .eq("category", category);
  if (error) throw error;

  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.choice]));
  const rows = questions ?? [];

  const perQuestion = rows.map((q) => ({
    id: q.id,
    topic: q.topic,
    correct: answerByQuestion.get(q.id) === q.correct_index,
  }));

  const total = perQuestion.length;
  const correctCount = perQuestion.filter((q) => q.correct).length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const level = scoreToLevel(score);

  const { data: attempt, error: insertError } = await supabaseAdmin
    .from("assessment_attempts")
    .insert({
      student_id: userId,
      category,
      total_questions: total,
      correct_count: correctCount,
      score,
      level,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  // Passing an assessment upgrades the student's self-declared skills in that
  // category to "assessment verified".
  if (score >= 50) {
    const { data: studentSkills } = await supabaseAdmin
      .from("student_skills")
      .select("id, verification_status, skills!inner(category)")
      .eq("student_id", userId)
      .eq("skills.category", category);

    const upgradable = (studentSkills ?? [])
      .filter((row) => row.verification_status === "self_declared")
      .map((row) => row.id);

    if (upgradable.length > 0) {
      await supabaseAdmin
        .from("student_skills")
        .update({ verification_status: "assessment_verified" })
        .in("id", upgradable);
    }
  }

  const strongTopics = [...new Set(perQuestion.filter((q) => q.correct).map((q) => q.topic))];
  const weakTopics = [...new Set(perQuestion.filter((q) => !q.correct).map((q) => q.topic))];

  return {
    attemptId: attempt.id,
    total,
    correctCount,
    score,
    level,
    strongTopics,
    weakTopics,
    verifiedSkills: score >= 50,
  };
}
