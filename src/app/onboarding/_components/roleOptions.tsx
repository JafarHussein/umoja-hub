import React from 'react';
import { Sprout, ShoppingBasket, GraduationCap, BookOpenCheck } from 'lucide-react';
import { Role } from '@/types';

// The four self-selectable roles, defined once so the role picker cannot drift
// between the screens that render it.
//
// ADMIN is absent by construction — security invariant #1 of
// AUTH_ONBOARDING_FLOW_V2: there is no public path to an admin account.
// NGO, EMPLOYER and INSTITUTION are also absent: those are organisation accounts
// provisioned out of band, not identities a visitor claims for themselves.
//
// Icons are Lucide, at icon weight rather than illustration weight. Their job is
// to make a row scannable — to let someone find "Farmer" without reading all
// four — not to depict the role. The card's title and description carry the
// meaning, which is why the icons are decorative and aria-hidden.
export interface IRoleOption {
  value: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const ROLE_OPTIONS: IRoleOption[] = [
  {
    value: Role.FARMER,
    label: 'Farmer',
    description: 'Sell produce direct to buyers',
    icon: <Sprout />,
  },
  {
    value: Role.BUYER,
    label: 'Buyer',
    description: 'Source direct from verified farms',
    icon: <ShoppingBasket />,
  },
  {
    value: Role.STUDENT,
    label: 'Student',
    description: 'Turn your coursework into real engineering',
    icon: <GraduationCap />,
  },
  {
    value: Role.LECTURER,
    label: 'Lecturer',
    description: 'Mentor and review student engineering',
    icon: <BookOpenCheck />,
  },
];
