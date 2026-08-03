// The AI brief context library — the industry/persona scaffolding the Education
// Hub feeds to the model when generating a student project brief. A versioned
// singleton, authored (not generated), carried over verbatim from the retired
// scripts/seed.ts.

import type mongoose from 'mongoose';
import { StudentTier } from '../../../src/types';

export function briefContextLibrary(adminId: mongoose.Types.ObjectId): Record<string, unknown> {
  return {
    version: 1,
    updatedBy: adminId,
    contexts: [
      {
        id: 'agri-supply-chain',
        industryName: 'Agricultural Supply Chain',
        description:
          'Systems that connect smallholder farmers with buyers, track produce quality, manage inventory, and enable direct market access without middleman dependency.',
        clientPersonaTemplate: {
          businessTypes: [
            'farmer cooperative',
            'agro-dealer network',
            'export fresh produce company',
          ],
          counties: ['Nyandarua', 'Uasin Gishu', 'Kirinyaga', 'Nakuru', 'Meru'],
          contexts: [
            'post-harvest loss reduction',
            'direct buyer-farmer connectivity',
            'input supply verification',
          ],
        },
        problemDomains: [
          'traceability from farm to market',
          'quality grading and certification',
          'payment timing and M-Pesa integration',
          'cold chain logistics coordination',
        ],
        kenyanConstraints: [
          'unreliable mobile data connectivity in rural areas',
          'USSD-first design for feature phone users',
          'KES currency, M-Pesa as primary payment rail',
          'road condition variability affecting delivery windows',
        ],
        exampleProjects: [
          'Farmer produce listing and order management system',
          'Input supply verification and counterfeit detection tool',
          'Cooperative group buying platform',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE],
      },
      {
        id: 'health-community',
        industryName: 'Community Health Systems',
        description:
          'Digital tools supporting community health workers (CHWs) in Kenya — patient tracking, referral management, supply chain for health commodities, and reporting to county health offices.',
        clientPersonaTemplate: {
          businessTypes: ['county health department', 'NGO health programme', 'community clinic'],
          counties: ['Kisumu', 'Homa Bay', 'Siaya', 'Migori', 'Turkana'],
          contexts: [
            'last-mile health delivery',
            'maternal and child health tracking',
            'malaria and TB case management',
          ],
        },
        problemDomains: [
          'offline-first patient records for CHWs without data',
          'referral pathway management from village to hospital',
          'commodity stock tracking (ARVs, bed nets, vaccines)',
          'routine reporting aggregation for county dashboards',
        ],
        kenyanConstraints: [
          'offline-capable design — no data connectivity assumed',
          'Swahili and local language support required',
          'low-literacy interface considerations',
          'solar charging contexts — battery-conscious design',
        ],
        exampleProjects: [
          'CHW patient visit and referral tracking app',
          'Community health commodity stock management system',
        ],
        targetTiers: [StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'fintech-sme',
        industryName: 'SME Financial Services',
        description:
          'Digital finance tools for small and medium enterprises in Kenya — invoice financing, M-Pesa business API integration, simple bookkeeping, and SACCO loan management.',
        clientPersonaTemplate: {
          businessTypes: ['informal retailer', 'SACCO', 'chama (investment group)', 'market trader'],
          counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
          contexts: [
            'working capital management',
            'group savings and lending',
            'digital invoice and receipt management',
          ],
        },
        problemDomains: [
          'M-Pesa payment reconciliation and reporting',
          'group savings (chama) management and transparency',
          'invoice and expense tracking for informal businesses',
          'credit scoring from transaction history',
        ],
        kenyanConstraints: [
          'KES currency only, M-Pesa primary payment rail',
          'mixed digital-cash transaction environments',
          'Central Bank of Kenya (CBK) regulatory compliance awareness',
          'WhatsApp and USSD as primary communication channels',
        ],
        exampleProjects: [
          'Chama group savings and loan management platform',
          'SME invoice management and M-Pesa reconciliation tool',
          'SACCO member portal with loan application and tracking',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'edtech-secondary',
        industryName: 'Secondary Education Technology',
        description:
          'Digital tools supporting Kenya\'s CBC (Competency-Based Curriculum) transition — student progress tracking, teacher resource libraries, formative assessment tools, and parent communication systems.',
        clientPersonaTemplate: {
          businessTypes: ['public secondary school', 'private academy', 'county education office'],
          counties: ['Nairobi', 'Kiambu', 'Mombasa', 'Nyeri', 'Uasin Gishu'],
          contexts: [
            'CBC transition support',
            'student performance monitoring',
            'teacher professional development',
          ],
        },
        problemDomains: [
          'student competency tracking across CBC strands',
          'teacher lesson planning and resource sharing',
          'formative assessment and feedback collection',
          'parent-teacher communication without email dependency',
        ],
        kenyanConstraints: [
          'WhatsApp-first parent communication',
          'limited device availability per student',
          'intermittent electricity and connectivity in rural schools',
          'KICD curriculum alignment required',
        ],
        exampleProjects: [
          'CBC student portfolio and competency tracking system',
          'School resource library and lesson planning tool',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE],
      },
      {
        id: 'transport-logistics',
        industryName: 'Road Transport and Logistics',
        description:
          'Fleet management, cargo booking, and route optimisation systems for Kenya\'s matatu operators, boda boda networks, and long-haul trucking companies.',
        clientPersonaTemplate: {
          businessTypes: [
            'matatu SACCO',
            'boda boda cooperative',
            'logistics company',
            'clearing and forwarding agent',
          ],
          counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru'],
          contexts: [
            'urban passenger transport',
            'inter-county cargo movement',
            'last-mile delivery coordination',
          ],
        },
        problemDomains: [
          'real-time vehicle tracking and driver management',
          'cargo booking and customer communication',
          'fuel consumption monitoring and cost allocation',
          'NTSA compliance and vehicle licensing tracking',
        ],
        kenyanConstraints: [
          'GPS coverage gaps in Northern Kenya',
          'NTSA regulatory compliance requirements',
          'KES pricing and M-Pesa payment integration',
          'driver literacy and USSD interface considerations',
        ],
        exampleProjects: [
          'Matatu route and capacity management system',
          'Cargo booking and tracking platform for SME logistics',
        ],
        targetTiers: [StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'water-utilities',
        industryName: 'Water Utility Management',
        description:
          'Digital systems for water service providers — meter reading, billing, leak detection reporting, and customer service management for county water utilities and community water projects.',
        clientPersonaTemplate: {
          businessTypes: [
            'county water utility',
            'community water project',
            'water bowser operator',
          ],
          counties: ['Nairobi', 'Mombasa', 'Machakos', 'Nakuru', 'Kisumu'],
          contexts: [
            'meter-to-billing workflow automation',
            'leak reporting and maintenance tracking',
            'prepaid water token management',
          ],
        },
        problemDomains: [
          'mobile meter reading and billing cycle management',
          'customer billing disputes and payment reconciliation',
          'non-revenue water tracking (leaks and illegal connections)',
          'prepaid token generation and distribution',
        ],
        kenyanConstraints: [
          'WASREB regulatory compliance',
          'M-Pesa and cash payment mix',
          'field workforce with varying digital literacy',
          'intermittent connectivity in field operations',
        ],
        exampleProjects: [
          'Mobile meter reading and billing platform',
          'Water leak report and repair tracking system',
        ],
        targetTiers: [StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
      {
        id: 'tourism-hospitality',
        industryName: 'Tourism and Hospitality',
        description:
          'Booking, operations, and guest management systems for Kenya\'s tourism sector — safari lodges, eco-camps, tour operators, and cultural experience providers.',
        clientPersonaTemplate: {
          businessTypes: [
            'safari lodge',
            'eco-camp',
            'tour operator',
            'cultural tourism enterprise',
          ],
          counties: ['Narok', 'Laikipia', 'Samburu', 'Kilifi', 'Taita-Taveta'],
          contexts: [
            'online booking and availability management',
            'guide and vehicle scheduling',
            'wildlife and activity itinerary building',
          ],
        },
        problemDomains: [
          'multi-channel booking management (direct, agent, OTA)',
          'guide and vehicle availability scheduling',
          'guest experience documentation and upsell',
          'conservation fee and park levy tracking',
        ],
        kenyanConstraints: [
          'KTB and county tourism board compliance',
          'USD and KES dual-currency pricing',
          'satellite internet dependency in remote lodges',
          'KWS conservation area requirements',
        ],
        exampleProjects: [
          'Safari lodge booking and operations management system',
          'Tour itinerary builder and guide scheduling platform',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE],
      },
      {
        id: 'waste-recycling',
        industryName: 'Waste Management and Recycling',
        description:
          'Digital platforms supporting Kenya\'s informal recycling sector and formal waste management companies — collection routing, waste picker coordination, material tracking, and buyer-seller matching for recyclables.',
        clientPersonaTemplate: {
          businessTypes: [
            'waste collection company',
            'recycling aggregator',
            'informal waste picker cooperative',
            'county environment department',
          ],
          counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
          contexts: [
            'waste collection route optimisation',
            'recyclable material price discovery',
            'informal sector formalisation',
          ],
        },
        problemDomains: [
          'waste picker registration and payment management',
          'recyclable material price tracking (paper, plastic, metal)',
          'collection route planning and real-time tracking',
          'county waste permit and compliance management',
        ],
        kenyanConstraints: [
          'NEMA regulatory compliance',
          'informal sector inclusion — basic phone and USSD support',
          'M-Pesa micro-payment for waste pickers',
          'Nairobi County waste management by-laws',
        ],
        exampleProjects: [
          'Waste picker registration and M-Pesa payment platform',
          'Recyclable material marketplace and price discovery tool',
        ],
        targetTiers: [StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED],
      },
    ],
  };
}
