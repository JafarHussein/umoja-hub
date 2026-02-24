'use client';

interface IClientPersona {
  name: string;
  businessType: string;
  county: string;
  technicalLiteracy: 'low' | 'medium' | 'high';
  context: string;
}

interface IBriefDisplayProps {
  brief: {
    projectTitle: string;
    clientPersona: IClientPersona;
    problemStatement: string;
    coreRequirements: string[];
    technicalRequirements: string[];
    kenyanConstraints: string[];
    outOfScope: string[];
    successCriteria: string[];
    suggestedTechStack: string[];
    estimatedDurationWeeks: number;
    industryContext: string;
  };
  tier: string;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-t3 text-text-primary mb-3">{children}</h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 font-body text-t5 text-text-secondary">
          <span className="text-accent-green mt-0.5 flex-shrink-0">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BriefDisplay({ brief, tier }: IBriefDisplayProps) {
  const literacyLabel: Record<string, string> = {
    low: 'Low digital literacy',
    medium: 'Medium digital literacy',
    high: 'High digital literacy',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading text-t2 text-text-primary">{brief.projectTitle}</h2>
            <p className="font-body text-t6 text-text-secondary mt-1">{brief.industryContext}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="font-mono text-t6 text-accent-green border border-accent-green/30 rounded-[2px] px-2 py-0.5">
              {tier}
            </span>
            <span className="font-mono text-t6 text-text-secondary">
              {brief.estimatedDurationWeeks}w project
            </span>
          </div>
        </div>

        {/* Client Persona */}
        <div className="bg-surface-secondary border border-accent-green/20 rounded p-4">
          <p className="font-mono text-t6 text-accent-green mb-3 uppercase tracking-wider">
            Client Persona
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
            <div>
              <span className="font-body text-t6 text-text-disabled">Name</span>
              <p className="font-body text-t5 text-text-primary">{brief.clientPersona.name}</p>
            </div>
            <div>
              <span className="font-body text-t6 text-text-disabled">Business</span>
              <p className="font-body text-t5 text-text-primary">{brief.clientPersona.businessType}</p>
            </div>
            <div>
              <span className="font-body text-t6 text-text-disabled">County</span>
              <p className="font-body text-t5 text-text-primary">{brief.clientPersona.county}</p>
            </div>
            <div>
              <span className="font-body text-t6 text-text-disabled">Tech Literacy</span>
              <p className="font-body text-t5 text-text-primary">
                {literacyLabel[brief.clientPersona.technicalLiteracy] ?? brief.clientPersona.technicalLiteracy}
              </p>
            </div>
          </div>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            {brief.clientPersona.context}
          </p>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <SectionHeading>Problem Statement</SectionHeading>
        <p className="font-body text-t4 text-text-secondary leading-relaxed">
          {brief.problemStatement}
        </p>
      </div>

      {/* Core Requirements */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <SectionHeading>Core Requirements</SectionHeading>
        <BulletList items={brief.coreRequirements} />
      </div>

      {/* Technical Requirements */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <SectionHeading>Technical Requirements</SectionHeading>
        <BulletList items={brief.technicalRequirements} />
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="font-body text-t6 text-text-disabled mb-2">Suggested tech stack</p>
          <div className="flex flex-wrap gap-2">
            {brief.suggestedTechStack.map((tech) => (
              <span
                key={tech}
                className="font-mono text-t6 text-text-secondary bg-surface-secondary border border-white/5 rounded-[2px] px-2 py-0.5"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Kenyan Constraints */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <SectionHeading>Kenyan Constraints</SectionHeading>
        <p className="font-body text-t6 text-text-disabled mb-3">
          These constraints are non-negotiable and reflect real-world conditions in Kenya.
        </p>
        <BulletList items={brief.kenyanConstraints} />
      </div>

      {/* Out of Scope */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <SectionHeading>Out of Scope</SectionHeading>
        <p className="font-body text-t6 text-text-disabled mb-3">Do not build these features.</p>
        <BulletList items={brief.outOfScope} />
      </div>

      {/* Success Criteria */}
      <div className="bg-surface-elevated border border-white/5 rounded p-6">
        <SectionHeading>Success Criteria</SectionHeading>
        <BulletList items={brief.successCriteria} />
      </div>
    </div>
  );
}
