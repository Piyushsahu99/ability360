export type MockAnswer = { questionId: string; choice: number | null };

export async function gradeMockTest(
  userId: string,
  testId: string,
  answers: MockAnswer[],
  secondsUsed: number,
  extraTime: boolean,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: questions, error } = await supabaseAdmin
    .from("mock_test_questions")
    .select("id, position, topic, prompt, options, correct_index, explanation")
    .eq("test_id", testId)
    .order("position");
  if (error) throw error;

  const rows = questions ?? [];
  const chosen = new Map(answers.map((a) => [a.questionId, a.choice]));

  const review = rows.map((q) => ({
    id: q.id,
    position: q.position,
    topic: q.topic,
    prompt: q.prompt,
    options: q.options as string[],
    chosen: chosen.get(q.id) ?? null,
    correctIndex: q.correct_index,
    correct: chosen.get(q.id) === q.correct_index,
    explanation: q.explanation,
  }));

  const total = review.length;
  const correctCount = review.filter((q) => q.correct).length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  const { data: attempt, error: insertError } = await supabaseAdmin
    .from("mock_test_attempts")
    .insert({
      student_id: userId,
      test_id: testId,
      score,
      correct_count: correctCount,
      total_questions: total,
      seconds_used: Math.max(0, Math.round(secondsUsed)),
      extra_time: extraTime,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const weakTopics = [...new Set(review.filter((q) => !q.correct).map((q) => q.topic))];
  const strongTopics = [...new Set(review.filter((q) => q.correct).map((q) => q.topic))];

  return { attemptId: attempt.id, total, correctCount, score, review, weakTopics, strongTopics };
}
