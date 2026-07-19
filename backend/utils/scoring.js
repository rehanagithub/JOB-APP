// Rule-based candidate/job fit scoring.
// This runs locally with no external API calls, so it's free and instant.
// Swap the body of `scoreCandidate` for a real LLM call later if you want
// richer natural-language fit assessment (see README "Upgrading AI scoring").

function normalizeSkill(s) {
  return (s || '').trim().toLowerCase();
}

export function scoreCandidate(job, candidateProfile) {
  const jobSkills = (job.key_skills || []).map(normalizeSkill);
  const candSkills = (candidateProfile.skills || []).map(normalizeSkill);

  // --- Skills match (0-50) ---
  let skillsMatch = 0;
  if (jobSkills.length > 0) {
    const overlap = jobSkills.filter((s) => candSkills.includes(s));
    skillsMatch = Math.round((overlap.length / jobSkills.length) * 50);
  } else {
    skillsMatch = 25; // no requirement specified, neutral score
  }

  // --- Experience match (0-30) ---
  const totalYears = (candidateProfile.experience || []).reduce(
    (sum, e) => sum + (Number(e.years) || 0),
    0
  );
  const requiredYears = parseFloat(job.experience_required) || 0;
  let experienceMatch;
  if (requiredYears === 0) experienceMatch = 20;
  else if (totalYears >= requiredYears) experienceMatch = 30;
  else experienceMatch = Math.round((totalYears / requiredYears) * 30);

  // --- Education match (0-20) ---
  const eduRequired = normalizeSkill(job.education_required);
  const candEducation = (candidateProfile.education || [])
    .map((e) => normalizeSkill(e.degree))
    .join(' ');
  let educationMatch = 10; // neutral default
  if (eduRequired) {
    educationMatch = candEducation.includes(eduRequired) ? 20 : 5;
  }

  const total = Math.min(100, skillsMatch + experienceMatch + educationMatch);

  const matchedSkills = jobSkills.filter((s) => candSkills.includes(s));
  const missingSkills = jobSkills.filter((s) => !candSkills.includes(s));

  return {
    score: total,
    breakdown: {
      skills_match: skillsMatch,
      experience_match: experienceMatch,
      education_match: educationMatch,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      notes:
        total >= 75
          ? 'Strong fit — meets most requirements.'
          : total >= 50
          ? 'Moderate fit — some gaps in skills or experience.'
          : 'Limited fit — significant gaps versus job requirements.',
    },
  };
}

// Aggregate suggestions for the employer "Insights & Recommendations" panel.
export function generateJobInsights(job, applications) {
  const insights = [];
  const total = applications.length;
  if (total === 0) {
    insights.push('No applications yet — try broadening key skills or boosting visibility.');
    return insights;
  }

  const avgScore =
    applications.reduce((sum, a) => sum + (a.ai_score || 0), 0) / total;
  if (avgScore < 50) {
    insights.push(
      'Average candidate fit is low. Consider relaxing experience requirements or clarifying required skills in the job description.'
    );
  }

  const missingSkillCounts = {};
  applications.forEach((a) => {
    (a.ai_score_breakdown?.missing_skills || []).forEach((s) => {
      missingSkillCounts[s] = (missingSkillCounts[s] || 0) + 1;
    });
  });
  const topMissing = Object.entries(missingSkillCounts).sort((a, b) => b[1] - a[1])[0];
  if (topMissing && topMissing[1] / total > 0.5) {
    insights.push(
      `Most candidates lack "${topMissing[0]}". If it's not essential, consider removing it to widen your pool.`
    );
  }

  if (total < 5) {
    insights.push('Low application volume — boosting this job could increase visibility.');
  }

  if (insights.length === 0) insights.push('Candidate pipeline looks healthy for this role.');
  return insights;
}
