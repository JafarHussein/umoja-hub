'use client';

import SkillsPassport from './SkillsPassport';
import { PortfolioStrength, StudentTier } from '@/types';

interface IVerifiedProject {
  engagementId: string;
  title: string;
  tier: string;
  techStack: string[];
  verifiedAt: string;
  averageScore: number;
  lecturerInstitution: string;
}

interface IPortfolioStats {
  verifiedProjectCount: number;
  totalProjectCount: number;
  techStacksUsed: string[];
  reviewerInstitutions: string[];
}

interface IPortfolioData {
  currentTier: string;
  portfolioStrength: string;
  stats: IPortfolioStats;
  verifiedProjects: IVerifiedProject[];
  verifiedSkills: Array<{
    skillName: string;
    category: string;
    tierDemonstrated: string;
    firstVerifiedAt: string;
    projectTitle: string;
    engagementId: string;
  }>;
  tierProgressionTimeline: Array<{ tier: string; unlockedAt: string }>;
  lastRecalculatedAt: string | null;
}

interface IStudentInfo {
  firstName: string;
  lastName: string;
  county: string;
  universityAffiliation: string | null;
  githubUsername: string | null;
  memberSince: string;
}

interface IPortfolioPageProps {
  student: IStudentInfo;
  portfolio: IPortfolioData;
  verificationBaseUrl?: string;
}

const strengthColors: Record<string, string> = {
  [PortfolioStrength.BUILDING]: 'text-text-secondary border-text-secondary/30',
  [PortfolioStrength.DEVELOPING]: 'text-amber-400 border-amber-400/30',
  [PortfolioStrength.STRONG]: 'text-accent-green border-accent-green/30',
  [PortfolioStrength.EXCEPTIONAL]: 'text-text-primary border-text-primary/30',
};

const tierColors: Record<string, string> = {
  [StudentTier.BEGINNER]: 'text-text-secondary',
  [StudentTier.INTERMEDIATE]: 'text-accent-green',
  [StudentTier.ADVANCED]: 'text-text-primary',
};

function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < Math.round(score) ? 'bg-accent-green' : 'bg-surface-secondary border border-white/10'}`}
        />
      ))}
      <span className="font-mono text-t6 text-text-secondary ml-2">
        {score.toFixed(1)}/{max}
      </span>
    </div>
  );
}

export default function PortfolioPage({ student, portfolio, verificationBaseUrl = '' }: IPortfolioPageProps) {
  const strengthClass = strengthColors[portfolio.portfolioStrength] ?? 'text-text-secondary border-white/10';

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-heading text-t1 text-text-primary">
              {student.firstName} {student.lastName}
            </h1>
            <p className="font-body text-t4 text-text-secondary mt-1">
              {student.universityAffiliation ?? 'Computer Science Student'}
              {student.county ? ` · ${student.county}` : ''}
            </p>
            {student.githubUsername && (
              <p className="font-mono text-t5 text-text-disabled mt-1">
                github.com/{student.githubUsername}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span
              className={`font-mono text-t5 border rounded-[2px] px-3 py-1 ${strengthClass}`}
            >
              {portfolio.portfolioStrength}
            </span>
            <span
              className={`font-mono text-t6 ${tierColors[portfolio.currentTier] ?? 'text-text-secondary'}`}
            >
              {portfolio.currentTier}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          <div>
            <p className="font-mono text-t1 text-text-primary">
              {portfolio.stats.verifiedProjectCount}
            </p>
            <p className="font-body text-t6 text-text-disabled">Verified projects</p>
          </div>
          <div>
            <p className="font-mono text-t1 text-text-primary">
              {portfolio.verifiedSkills.length}
            </p>
            <p className="font-body text-t6 text-text-disabled">Verified skills</p>
          </div>
          <div>
            <p className="font-mono text-t1 text-text-primary">
              {portfolio.stats.reviewerInstitutions.length}
            </p>
            <p className="font-body text-t6 text-text-disabled">Reviewing institutions</p>
          </div>
          <div>
            <p className="font-mono text-t1 text-text-primary">
              {portfolio.stats.techStacksUsed.length}
            </p>
            <p className="font-body text-t6 text-text-disabled">Technologies used</p>
          </div>
        </div>
      </div>

      {/* Tier Progression */}
      {portfolio.tierProgressionTimeline.length > 0 && (
        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h2 className="font-heading text-t2 text-text-primary mb-4">Tier Progression</h2>
          <div className="flex items-center gap-0">
            {portfolio.tierProgressionTimeline.map((entry, i) => (
              <div key={i} className="flex items-center gap-0">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-accent-green" />
                  <div className="mt-2 text-center">
                    <p className={`font-mono text-t6 ${tierColors[entry.tier] ?? 'text-text-secondary'}`}>
                      {entry.tier}
                    </p>
                    <p className="font-body text-t6 text-text-disabled">
                      {new Date(entry.unlockedAt).toLocaleDateString('en-KE', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {i < portfolio.tierProgressionTimeline.length - 1 && (
                  <div className="h-px w-16 bg-white/10 mb-8 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Projects */}
      <div>
        <h2 className="font-heading text-t2 text-text-primary mb-4">Verified Projects</h2>
        {portfolio.verifiedProjects.length === 0 ? (
          <div className="bg-surface-elevated border border-white/5 rounded p-6 text-center">
            <p className="font-body text-t4 text-text-secondary">No verified projects yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolio.verifiedProjects.map((project) => (
              <div
                key={project.engagementId}
                className="bg-surface-elevated border border-white/5 rounded p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-heading text-t3 text-text-primary">{project.title}</h3>
                    <p className="font-body text-t6 text-text-disabled mt-1">
                      Reviewed by {project.lecturerInstitution}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`font-mono text-t6 ${tierColors[project.tier] ?? 'text-text-secondary'}`}
                    >
                      {project.tier}
                    </span>
                    <p className="font-body text-t6 text-text-disabled">
                      {new Date(project.verifiedAt).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-t6 text-text-secondary bg-surface-secondary border border-white/5 rounded-[2px] px-2 py-0.5"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <ScoreDots score={project.averageScore} />
                  {verificationBaseUrl && (
                    <a
                      href={`${verificationBaseUrl}/experience/verify/${project.engagementId}`}
                      className="font-body text-t6 text-accent-green hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verify
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Passport */}
      <div>
        <h2 className="font-heading text-t2 text-text-primary mb-4">Skills Passport</h2>
        <SkillsPassport
          skills={portfolio.verifiedSkills}
          studentName={`${student.firstName} ${student.lastName}`}
        />
      </div>
    </div>
  );
}
