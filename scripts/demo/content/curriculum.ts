// Published curricula for the demo world.
//
// The point of the taxonomy is that the same subject wears a different label at
// every university — `SCS 231` at one and `BCS 231` at another are both
// Database Systems I. So the content here is authored once as a *spine* per
// discipline and stamped with each institution's own code prefix and programme
// name. Anything reading this downstream sees only knowledge areas.
//
// Deliberately, not every institution publishes. Two of the four in the demo
// world have a curriculum on the platform and two have not, because the
// self-declared path is the one most Kenyan students will actually take and it
// has to be visible in a demonstration rather than assumed.

import { AcademicDiscipline, KnowledgeArea } from '../../../src/types';

const KA = KnowledgeArea;

export interface SpineUnit {
  title: string;
  knowledgeAreas: KnowledgeArea[];
}

/** Units by year (outer) then semester (inner). Five per semester, as taught. */
export type Spine = SpineUnit[][][];

const CS_SPINE: Spine = [
  [
    [
      { title: 'Introduction to Programming', knowledgeAreas: [KA.PROGRAMMING_FUNDAMENTALS] },
      { title: 'Computer Organisation', knowledgeAreas: [KA.COMPUTER_ARCHITECTURE] },
      { title: 'Discrete Mathematics for Computing', knowledgeAreas: [KA.DATA_STRUCTURES_ALGORITHMS] },
      { title: 'Fundamentals of Information Systems', knowledgeAreas: [KA.SYSTEMS_ANALYSIS_DESIGN] },
      { title: 'Digital Logic Design', knowledgeAreas: [KA.COMPUTER_ARCHITECTURE] },
    ],
    [
      {
        title: 'Object-Oriented Programming',
        knowledgeAreas: [KA.PROGRAMMING_FUNDAMENTALS, KA.SOFTWARE_ENGINEERING],
      },
      { title: 'Data Structures and Algorithms I', knowledgeAreas: [KA.DATA_STRUCTURES_ALGORITHMS] },
      { title: 'Computer Architecture', knowledgeAreas: [KA.COMPUTER_ARCHITECTURE] },
      {
        title: 'Web Design Fundamentals',
        knowledgeAreas: [KA.WEB_DEVELOPMENT, KA.HUMAN_COMPUTER_INTERACTION],
      },
      { title: 'Systems Analysis', knowledgeAreas: [KA.SYSTEMS_ANALYSIS_DESIGN] },
    ],
  ],
  [
    [
      { title: 'Data Structures and Algorithms II', knowledgeAreas: [KA.DATA_STRUCTURES_ALGORITHMS] },
      { title: 'Database Systems I', knowledgeAreas: [KA.DATABASE_SYSTEMS] },
      { title: 'Operating Systems I', knowledgeAreas: [KA.OPERATING_SYSTEMS] },
      { title: 'Computer Networks I', knowledgeAreas: [KA.NETWORKING] },
      { title: 'Software Engineering I', knowledgeAreas: [KA.SOFTWARE_ENGINEERING] },
    ],
    [
      {
        title: 'Database Systems II',
        knowledgeAreas: [KA.DATABASE_SYSTEMS, KA.DATA_ENGINEERING],
      },
      {
        title: 'Operating Systems II',
        knowledgeAreas: [KA.OPERATING_SYSTEMS, KA.DISTRIBUTED_SYSTEMS],
      },
      {
        title: 'Computer Networks II',
        knowledgeAreas: [KA.NETWORKING, KA.INFORMATION_SECURITY],
      },
      { title: 'Software Engineering II', knowledgeAreas: [KA.SOFTWARE_ENGINEERING] },
      { title: 'Human–Computer Interaction', knowledgeAreas: [KA.HUMAN_COMPUTER_INTERACTION] },
    ],
  ],
  [
    [
      {
        title: 'Web Application Development',
        knowledgeAreas: [KA.WEB_DEVELOPMENT, KA.SOFTWARE_ENGINEERING],
      },
      { title: 'Mobile Application Development', knowledgeAreas: [KA.MOBILE_DEVELOPMENT] },
      { title: 'Artificial Intelligence', knowledgeAreas: [KA.ARTIFICIAL_INTELLIGENCE] },
      { title: 'Information Security', knowledgeAreas: [KA.INFORMATION_SECURITY] },
      { title: 'Design and Analysis of Algorithms', knowledgeAreas: [KA.DATA_STRUCTURES_ALGORITHMS] },
    ],
    [
      {
        title: 'Machine Learning',
        knowledgeAreas: [KA.MACHINE_LEARNING, KA.ARTIFICIAL_INTELLIGENCE],
      },
      {
        title: 'Distributed Systems',
        knowledgeAreas: [KA.DISTRIBUTED_SYSTEMS, KA.NETWORKING],
      },
      { title: 'Cloud Computing', knowledgeAreas: [KA.CLOUD_COMPUTING] },
      {
        title: 'Data Warehousing and Mining',
        knowledgeAreas: [KA.DATA_ENGINEERING, KA.MACHINE_LEARNING],
      },
      { title: 'Research Methods in Computing', knowledgeAreas: [KA.RESEARCH_METHODS] },
    ],
  ],
  [
    [
      {
        title: 'Advanced Database Systems',
        knowledgeAreas: [KA.DATABASE_SYSTEMS, KA.DISTRIBUTED_SYSTEMS],
      },
      { title: 'Software Quality and Testing', knowledgeAreas: [KA.SOFTWARE_ENGINEERING] },
      {
        title: 'Cryptography and Network Security',
        knowledgeAreas: [KA.INFORMATION_SECURITY, KA.NETWORKING],
      },
      {
        title: 'Project I',
        knowledgeAreas: [KA.RESEARCH_METHODS, KA.SOFTWARE_ENGINEERING],
      },
      {
        title: 'Big Data Analytics',
        knowledgeAreas: [KA.DATA_ENGINEERING, KA.MACHINE_LEARNING],
      },
    ],
    [
      {
        title: 'Project II',
        knowledgeAreas: [KA.SOFTWARE_ENGINEERING, KA.RESEARCH_METHODS],
      },
      {
        title: 'Cloud Native and DevOps',
        knowledgeAreas: [KA.CLOUD_COMPUTING, KA.SOFTWARE_ENGINEERING],
      },
      {
        title: 'Natural Language Processing',
        knowledgeAreas: [KA.MACHINE_LEARNING, KA.ARTIFICIAL_INTELLIGENCE],
      },
      {
        title: 'Mobile and Pervasive Computing',
        knowledgeAreas: [KA.MOBILE_DEVELOPMENT, KA.DISTRIBUTED_SYSTEMS],
      },
      {
        title: 'Systems Integration',
        knowledgeAreas: [KA.SYSTEMS_ANALYSIS_DESIGN, KA.SOFTWARE_ENGINEERING],
      },
    ],
  ],
];

const IT_SPINE: Spine = [
  [
    [
      { title: 'Programming Principles', knowledgeAreas: [KA.PROGRAMMING_FUNDAMENTALS] },
      { title: 'Introduction to Information Technology', knowledgeAreas: [KA.SYSTEMS_ANALYSIS_DESIGN] },
      { title: 'Computer Hardware and Maintenance', knowledgeAreas: [KA.COMPUTER_ARCHITECTURE] },
      {
        title: 'Web Publishing',
        knowledgeAreas: [KA.WEB_DEVELOPMENT, KA.HUMAN_COMPUTER_INTERACTION],
      },
      { title: 'Mathematics for Information Technology', knowledgeAreas: [KA.DATA_STRUCTURES_ALGORITHMS] },
    ],
    [
      { title: 'Structured Programming', knowledgeAreas: [KA.PROGRAMMING_FUNDAMENTALS] },
      { title: 'Database Fundamentals', knowledgeAreas: [KA.DATABASE_SYSTEMS] },
      { title: 'Data Communication', knowledgeAreas: [KA.NETWORKING] },
      { title: 'Operating Systems Concepts', knowledgeAreas: [KA.OPERATING_SYSTEMS] },
      { title: 'Systems Analysis and Design', knowledgeAreas: [KA.SYSTEMS_ANALYSIS_DESIGN] },
    ],
  ],
  [
    [
      {
        title: 'Object-Oriented Programming',
        knowledgeAreas: [KA.PROGRAMMING_FUNDAMENTALS, KA.SOFTWARE_ENGINEERING],
      },
      { title: 'Database Design and Administration', knowledgeAreas: [KA.DATABASE_SYSTEMS] },
      {
        title: 'Network Administration',
        knowledgeAreas: [KA.NETWORKING, KA.OPERATING_SYSTEMS],
      },
      { title: 'Web Technologies', knowledgeAreas: [KA.WEB_DEVELOPMENT] },
      { title: 'Information Systems Security', knowledgeAreas: [KA.INFORMATION_SECURITY] },
    ],
    [
      { title: 'Data Structures for IT', knowledgeAreas: [KA.DATA_STRUCTURES_ALGORITHMS] },
      {
        title: 'Server-Side Programming',
        knowledgeAreas: [KA.WEB_DEVELOPMENT, KA.SOFTWARE_ENGINEERING],
      },
      { title: 'Network Design and Management', knowledgeAreas: [KA.NETWORKING] },
      { title: 'Human–Computer Interaction', knowledgeAreas: [KA.HUMAN_COMPUTER_INTERACTION] },
      { title: 'Business Process Modelling', knowledgeAreas: [KA.SYSTEMS_ANALYSIS_DESIGN] },
    ],
  ],
  [
    [
      { title: 'Mobile Application Development', knowledgeAreas: [KA.MOBILE_DEVELOPMENT] },
      {
        title: 'Enterprise Systems Integration',
        knowledgeAreas: [KA.SYSTEMS_ANALYSIS_DESIGN, KA.DISTRIBUTED_SYSTEMS],
      },
      { title: 'Data Analytics', knowledgeAreas: [KA.DATA_ENGINEERING] },
      { title: 'IT Project Management', knowledgeAreas: [KA.SOFTWARE_ENGINEERING] },
      { title: 'Cloud Infrastructure', knowledgeAreas: [KA.CLOUD_COMPUTING] },
    ],
    [
      { title: 'Information Security Management', knowledgeAreas: [KA.INFORMATION_SECURITY] },
      {
        title: 'Data Warehousing',
        knowledgeAreas: [KA.DATA_ENGINEERING, KA.DATABASE_SYSTEMS],
      },
      { title: 'Machine Learning for IT', knowledgeAreas: [KA.MACHINE_LEARNING] },
      { title: 'Research Methods', knowledgeAreas: [KA.RESEARCH_METHODS] },
      {
        title: 'Systems Administration and Virtualisation',
        knowledgeAreas: [KA.OPERATING_SYSTEMS, KA.CLOUD_COMPUTING],
      },
    ],
  ],
  [
    [
      {
        title: 'Project I',
        knowledgeAreas: [KA.RESEARCH_METHODS, KA.SOFTWARE_ENGINEERING],
      },
      {
        title: 'Distributed Application Development',
        knowledgeAreas: [KA.DISTRIBUTED_SYSTEMS, KA.WEB_DEVELOPMENT],
      },
      { title: 'Digital Forensics', knowledgeAreas: [KA.INFORMATION_SECURITY] },
      { title: 'Advanced Networking', knowledgeAreas: [KA.NETWORKING] },
      { title: 'Business Intelligence', knowledgeAreas: [KA.DATA_ENGINEERING] },
    ],
    [
      {
        title: 'Project II',
        knowledgeAreas: [KA.SOFTWARE_ENGINEERING, KA.RESEARCH_METHODS],
      },
      {
        title: 'DevOps and Site Reliability',
        knowledgeAreas: [KA.CLOUD_COMPUTING, KA.SOFTWARE_ENGINEERING],
      },
      {
        title: 'Emerging Technologies',
        knowledgeAreas: [KA.ARTIFICIAL_INTELLIGENCE, KA.CLOUD_COMPUTING],
      },
      {
        title: 'IT Governance and Audit',
        knowledgeAreas: [KA.INFORMATION_SECURITY, KA.SYSTEMS_ANALYSIS_DESIGN],
      },
      {
        title: 'Mobile and Cloud Integration',
        knowledgeAreas: [KA.MOBILE_DEVELOPMENT, KA.CLOUD_COMPUTING],
      },
    ],
  ],
];

export interface PublishedProgramme {
  name: string;
  discipline: AcademicDiscipline;
  /** The institution's own code prefix — the label the taxonomy exists to absorb. */
  codePrefix: string;
  spine: Spine;
}

/**
 * Institution name → the programmes it has published here. Institutions absent
 * from this map have published nothing, and their students self-declare.
 */
export const PUBLISHED_CURRICULA: Record<string, PublishedProgramme[]> = {
  'University of Nairobi': [
    {
      name: 'BSc Computer Science',
      discipline: AcademicDiscipline.CS,
      codePrefix: 'SCS',
      spine: CS_SPINE,
    },
    {
      name: 'BSc Information Technology',
      discipline: AcademicDiscipline.IT,
      codePrefix: 'SIT',
      spine: IT_SPINE,
    },
  ],
  'Jomo Kenyatta University of Agriculture and Technology': [
    {
      name: 'BSc Computer Science',
      discipline: AcademicDiscipline.CS,
      codePrefix: 'BCS',
      spine: CS_SPINE,
    },
    {
      name: 'BSc Information Technology',
      discipline: AcademicDiscipline.IT,
      codePrefix: 'BIT',
      spine: IT_SPINE,
    },
  ],
};

export interface FlattenedUnit {
  code: string;
  title: string;
  year: number;
  semester: number;
  knowledgeAreas: KnowledgeArea[];
}

/** Every unit of a programme, with the institution's code stamped on. */
export function flattenSpine(programme: PublishedProgramme): FlattenedUnit[] {
  const units: FlattenedUnit[] = [];
  programme.spine.forEach((semesters, yearIndex) => {
    semesters.forEach((spineUnits, semesterIndex) => {
      spineUnits.forEach((unit, unitIndex) => {
        units.push({
          code: `${programme.codePrefix} ${yearIndex + 1}${semesterIndex + 1}${unitIndex + 1}`,
          title: unit.title,
          year: yearIndex + 1,
          semester: semesterIndex + 1,
          knowledgeAreas: unit.knowledgeAreas,
        });
      });
    });
  });
  return units;
}

export const PROGRAMME_DURATION_YEARS = 4;
export const PROGRAMME_SEMESTERS_PER_YEAR = 2;

/**
 * The discipline spine on its own, for students whose institution has published
 * nothing. They are studying the same subjects; the platform simply has no
 * institutional record to attribute them to.
 */
export function spineFor(discipline: AcademicDiscipline): Spine {
  return discipline === AcademicDiscipline.IT ? IT_SPINE : CS_SPINE;
}

export const SELF_DECLARED_PROGRAMME_NAMES: Record<AcademicDiscipline, string> = {
  [AcademicDiscipline.CS]: 'BSc Computer Science',
  [AcademicDiscipline.IT]: 'BSc Information Technology',
};
