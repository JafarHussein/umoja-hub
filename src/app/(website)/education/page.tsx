import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Education Hub — UmojaHub',
  description:
    'Verified project work. Public record. Auditable chain. A structured verification platform for Kenyan CS students.',
};

const IS_ITEMS = [
  'A structured process — not a self-reported credential',
  'Three specific documents reviewed against a published rubric',
  'Peer review followed by an independent verified-lecturer decision',
  'A cryptographic hash confirming documents were not altered after review',
  'A permanent, publicly readable portfolio entry',
] as const;

const IS_NOT_ITEMS = [
  'An accredited academic credential',
  'A certification of employment readiness',
  'Affiliated with any university or government body',
  'A guarantee of code authorship',
  'A salary floor or benchmark',
] as const;

const AUDIENCE_CARDS = [
  {
    name: 'Students',
    desc: 'What Portfolio Verified means for you, what the process requires, and what an employer sees.',
    href: '/for/students',
    bg: 'bg-[#1E3535]',
    nameColor: 'text-[#56A8A2]',
    linkColor: 'text-[#56A8A2]',
    path: '/for/students',
  },
  {
    name: 'Lecturers',
    desc: 'What reviewer participation involves, how verification works, and why it matters.',
    href: '/for/lecturers',
    bg: 'bg-[#2D2645]',
    nameColor: 'text-[#9581CC]',
    linkColor: 'text-[#9581CC]',
    path: '/for/lecturers',
  },
  {
    name: 'Employers',
    desc: 'What was verified, by whom, with what evidence, and how to independently confirm it.',
    href: '/for/employers',
    bg: 'bg-[#4A3A2A]',
    nameColor: 'text-[#D88A5A]',
    linkColor: 'text-[#D88A5A]',
    path: '/for/employers',
  },
] as const;

export default function EducationHubPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#131619] px-[160px] py-[120px] flex flex-col gap-7">
        <p className="font-jakarta font-500 text-[0.875rem] tracking-[0.02em] text-[#56A8A2]">
          Education Hub
        </p>
        <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] max-w-[900px]">
          Verified project work.
          <br />
          Public record.
          <br />
          Auditable chain.
        </h1>
        <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A] max-w-[840px]">
          The Education Hub is a structured project verification platform for Kenyan CS students.
          Projects pass through a documented review process involving peer review and verified
          lecturer review. Successful projects are recorded in a permanent, publicly verifiable
          portfolio.
        </p>
      </section>

      {/* S1 — What It Is */}
      <section className="bg-[#F5F4F0] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 01
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] max-w-[900px]">
          What the Education Hub is
        </p>
        <div className="flex gap-8 w-full">
          {/* IS column */}
          <div className="flex-1 bg-[#ECE8E1] border-b-2 border-[#2E7D78] p-[40px] flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[0.9375rem] tracking-[0.02em] text-[#2E7D78]">
              What it IS
            </p>
            {IS_ITEMS.map((item) => (
              <p
                key={item}
                className="font-jakarta font-400 text-[1rem] text-[#353C45] leading-[1.6]"
              >
                ✓{'  '}
                {item}
              </p>
            ))}
          </div>

          {/* IS NOT column */}
          <div className="flex-1 bg-[#ECE8E1] border-b-2 border-[#B86A3D] p-[40px] flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[0.9375rem] tracking-[0.02em] text-[#B86A3D]">
              What it IS NOT
            </p>
            {IS_NOT_ITEMS.map((item) => (
              <p
                key={item}
                className="font-jakarta font-400 text-[1rem] text-[#353C45] leading-[1.6]"
              >
                ×{'  '}
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* S2 — Audience Routing */}
      <section className="bg-[#1B2025] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 02
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] max-w-[800px]">
          Find your page
        </p>
        <div className="flex gap-5 w-full">
          {AUDIENCE_CARDS.map((card) => (
            <Link
              key={card.name}
              href={card.href}
              className={`flex-1 ${card.bg} px-8 py-9 flex flex-col gap-5 hover:opacity-90 transition-opacity`}
            >
              <p className={`font-jakarta font-600 text-[1.375rem] tracking-[-0.01em] ${card.nameColor}`}>
                {card.name}
              </p>
              <p className="font-jakarta font-400 text-[0.9375rem] text-[#A9A29A] leading-[1.6]">
                {card.desc}
              </p>
              <p className={`font-ibm-mono not-italic text-[0.75rem] ${card.linkColor}`}>
                {card.path}{'  →'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* How-Strip */}
      <section className="bg-[#ECE8E1] px-[160px] py-[48px] flex items-center">
        <p className="flex-1 font-jakarta font-400 text-[1.125rem] text-[#353C45] leading-[1.4]">
          Want the complete end-to-end walkthrough?
        </p>
        <Link
          href="/how-it-works"
          className="bg-[#2E7D78] px-[28px] py-[14px] font-jakarta font-600 text-[0.9375rem] text-[#F2F0EC] hover:opacity-90 transition-opacity shrink-0"
        >
          How It Works
        </Link>
      </section>
    </>
  );
}
