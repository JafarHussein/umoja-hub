'use client';

import { StudentTier } from '@/types';

interface IVerifiedSkill {
  skillName: string;
  category: string;
  tierDemonstrated: string;
  firstVerifiedAt: string;
  projectTitle: string;
  engagementId: string;
}

interface ISkillsPassportProps {
  skills: IVerifiedSkill[];
  studentName?: string;
}

const tierColors: Record<string, string> = {
  [StudentTier.BEGINNER]: 'text-text-secondary',
  [StudentTier.INTERMEDIATE]: 'text-accent-green',
  [StudentTier.ADVANCED]: 'text-text-primary',
};

function SkillsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-14 bg-surface-secondary border border-white/5 rounded animate-pulse"
        />
      ))}
    </div>
  );
}

export default function SkillsPassport({ skills, studentName }: ISkillsPassportProps) {
  if (skills.length === 0) {
    return (
      <div className="bg-surface-elevated border border-white/5 rounded p-6 text-center">
        <p className="font-body text-t4 text-text-secondary mb-2">No verified skills yet</p>
        <p className="font-body text-t5 text-text-disabled">
          Skills are added automatically when a project is verified by a lecturer.
        </p>
      </div>
    );
  }

  // Group by category
  const byCategory = skills.reduce<Record<string, IVerifiedSkill[]>>((acc, skill) => {
    const cat = skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(skill);
    return acc;
  }, {});

  return (
    <div className="bg-surface-elevated border border-white/5 rounded">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="font-heading text-t3 text-text-primary">Skills Passport</h3>
        {studentName && (
          <p className="font-body text-t6 text-text-secondary mt-1">
            Verified skills for {studentName} · {skills.length} skill{skills.length !== 1 ? 's' : ''}
          </p>
        )}
        <p className="font-body text-t6 text-text-disabled mt-1">
          Skills are verified by lecturers only — no self-reported skills
        </p>
      </div>

      {/* Skills by category */}
      <div className="p-6 space-y-6">
        {Object.entries(byCategory).map(([category, categorySkills]) => (
          <div key={category}>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-wider mb-3">
              {category}
            </p>
            <div className="space-y-2">
              {categorySkills.map((skill) => (
                <div
                  key={`${skill.skillName}-${skill.engagementId}`}
                  className="flex items-start justify-between gap-4 px-4 py-3 bg-surface-secondary border border-white/5 rounded-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Verified checkmark */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="text-accent-green flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 7L5.5 10L11.5 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="min-w-0">
                      <p className="font-body text-t5 text-text-primary">{skill.skillName}</p>
                      <p className="font-body text-t6 text-text-disabled truncate">
                        via {skill.projectTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`font-mono text-t6 ${tierColors[skill.tierDemonstrated] ?? 'text-text-secondary'}`}
                    >
                      {skill.tierDemonstrated}
                    </span>
                    <span className="font-body text-t6 text-text-disabled">
                      {new Date(skill.firstVerifiedAt).toLocaleDateString('en-KE', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SkillsSkeleton };
