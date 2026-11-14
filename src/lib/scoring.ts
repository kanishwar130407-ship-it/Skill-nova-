import type {
  CareerRole,
  GapPriority,
  NumericProficiency,
  ProficiencyLevel,
  RoleGapSummary,
  Skill,
  SkillEvidence,
  SkillGap,
} from '../types/domain.ts';

export function proficiencyToNumeric(level: ProficiencyLevel): NumericProficiency {
  switch (level) {
    case 'beginner':
      return 1;
    case 'intermediate':
      return 2;
    case 'advanced':
      return 3;
    case 'unknown':
    default:
      return 0;
  }
}

export function numericToProficiency(n: number): ProficiencyLevel {
  if (n >= 3) return 'advanced';
  if (n >= 2) return 'intermediate';
  if (n >= 1) return 'beginner';
  return 'unknown';
}

export function levelLabel(level: ProficiencyLevel): string {
  switch (level) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    case 'unknown':
    default:
      return 'Unassessed / Unknown';
  }
}

/**
 * Transparent, deterministic scoring function.
 * - Keeps self-reported skills separate from assessed skills.
 * - Never treats missing assessment evidence ("unknown") as proof of zero knowledge;
 *   instead flags it as unverified and reduces alignment confidence.
 */
export function computeRoleGapSummary(
  role: CareerRole,
  evidenceList: SkillEvidence[],
  skillsTaxonomy: Skill[],
): RoleGapSummary {
  const evidenceBySkill = new Map<string, SkillEvidence>();
  for (const ev of evidenceList) {
    evidenceBySkill.set(ev.skillId, ev);
  }

  const skillMap = new Map<string, Skill>();
  for (const sk of skillsTaxonomy) {
    skillMap.set(sk.id, sk);
  }

  let totalWeight = 0;
  let earnedWeightedCredit = 0;
  let verifiedSkillCount = 0;
  let selfReportedOnlyCount = 0;
  let missingSkillCount = 0;
  let unknownSkillCount = 0;

  const gaps: SkillGap[] = [];

  for (const req of role.requirements) {
    const skillMeta = skillMap.get(req.skillId);
    const skillName = skillMeta?.name ?? req.skillName ?? req.skillId;
    const category = skillMeta?.category ?? 'fundamentals';
    const ev = evidenceBySkill.get(req.skillId);

    const selfReportedLevel: ProficiencyLevel = ev?.selfReportedLevel ?? 'unknown';
    const assessedLevel: ProficiencyLevel = ev?.assessedLevel ?? 'unknown';

    // Assessed evidence is authoritative; self-reported is provisional until validated
    const effectiveLevel: ProficiencyLevel =
      assessedLevel !== 'unknown' ? assessedLevel : selfReportedLevel;

    const requiredNum = proficiencyToNumeric(req.requiredLevel);
    const assessedNum = proficiencyToNumeric(assessedLevel);
    const selfNum = proficiencyToNumeric(selfReportedLevel);
    const effectiveNum = proficiencyToNumeric(effectiveLevel);

    const hasAssessed = assessedLevel !== 'unknown';
    const hasSelf = selfReportedLevel !== 'unknown';

    if (hasAssessed) {
      verifiedSkillCount += 1;
    } else if (hasSelf) {
      selfReportedOnlyCount += 1;
    } else {
      unknownSkillCount += 1;
      if (req.importance === 'required') {
        missingSkillCount += 1;
      }
    }

    // Credit calculation:
    // - Assessed level receives 100% credit toward required level.
    // - Self-reported level (unassessed) receives 75% provisional credit so it is clearly distinct from verified mastery.
    // - Unknown receives 0 verified credit (not assumed to be zero knowledge, simply unverified).
    let creditNum = 0;
    if (hasAssessed) {
      creditNum = Math.min(assessedNum, requiredNum);
    } else if (hasSelf) {
      creditNum = Math.min(selfNum * 0.75, requiredNum);
    }

    totalWeight += req.weight;
    earnedWeightedCredit += req.weight * (requiredNum > 0 ? creditNum / requiredNum : 0);

    const gapScore = Math.max(0, requiredNum - effectiveNum);
    const weightedGap = gapScore * req.weight;
    const requiresValidation = !hasAssessed && (hasSelf || req.importance === 'required');

    let priority: GapPriority = 'met';
    if (gapScore === 0) {
      priority = hasAssessed ? 'met' : 'low';
    } else if (req.importance === 'required' && weightedGap >= 8) {
      priority = 'critical';
    } else if (req.importance === 'required' && weightedGap >= 4) {
      priority = 'high';
    } else {
      priority = 'medium';
    }

    let explanation = '';
    let recommendedNextAction = '';

    if (gapScore === 0 && hasAssessed) {
      explanation = `Assessed at ${levelLabel(assessedLevel)}, meeting the ${levelLabel(req.requiredLevel)} target for this role template.`;
      recommendedNextAction = 'Maintain via capstone integration';
    } else if (gapScore === 0 && hasSelf) {
      explanation = `Self-reported at ${levelLabel(selfReportedLevel)} (meets ${levelLabel(req.requiredLevel)} target), but no SkillNova assessment recorded yet.`;
      recommendedNextAction = `Verify ${skillName} with a quick check`;
    } else if (!hasAssessed && !hasSelf) {
      explanation = `No assessment or self-reported evidence yet. Unknown proficiency is treated as unverified rather than zero capability.`;
      recommendedNextAction = `Start ${skillName} module or take baseline check`;
    } else {
      explanation = `Current ${hasAssessed ? 'assessed' : 'self-reported'} level is ${levelLabel(effectiveLevel)}; target is ${levelLabel(req.requiredLevel)} (${gapScore} level${gapScore > 1 ? 's' : ''} below target).`;
      recommendedNextAction = `Complete ${skillName} lessons & assessment`;
    }

    gaps.push({
      skillId: req.skillId,
      skillName,
      category,
      importance: req.importance,
      weight: req.weight,
      selfReportedLevel,
      assessedLevel,
      effectiveLevel,
      requiredLevel: req.requiredLevel,
      evidenceSource: ev?.sourceType ?? 'none',
      confidence: ev?.confidence ?? 0,
      gapScore,
      weightedGap,
      priority,
      requiresValidation,
      explanation,
      recommendedNextAction,
    });
  }

  // Sort gaps: critical/high missing skills first, then unverified, then met
  const priorityOrder: Record<GapPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    met: 4,
  };

  const sortedGaps = [...gaps].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.weightedGap - a.weightedGap;
  });

  const alignmentPercent =
    totalWeight > 0 ? Math.round((earnedWeightedCredit / totalWeight) * 100) : 0;

  const totalReqs = role.requirements.length;
  const verifiedRatio = totalReqs > 0 ? verifiedSkillCount / totalReqs : 0;
  const alignmentConfidence: 'high' | 'moderate' | 'low' =
    verifiedRatio >= 0.65 ? 'high' : verifiedRatio >= 0.25 || selfReportedOnlyCount >= 2 ? 'moderate' : 'low';

  const strengths = sortedGaps.filter((g) => g.gapScore === 0);
  const needsValidation = sortedGaps.filter((g) => g.requiresValidation);

  const formulaNotes =
    'Role alignment is calculated deterministically: each role skill requirement carries a template weight (1–5). ' +
    'Assessed skills earn 100% credit up to the target level; unverified self-reported skills earn 75% provisional credit; ' +
    'unknown skills earn 0% verified credit (reflecting missing evidence, not proof of zero knowledge) and reduce confidence. ' +
    'This percentage estimates alignment with an editable demonstration template, not employability.';

  return {
    roleId: role.id,
    roleTitle: role.title,
    alignmentPercent,
    alignmentConfidence,
    verifiedSkillCount,
    selfReportedOnlyCount,
    missingSkillCount,
    unknownSkillCount,
    gaps: sortedGaps,
    strengths,
    needsValidation,
    formulaNotes,
  };
}
