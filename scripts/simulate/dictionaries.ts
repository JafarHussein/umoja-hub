// Kenyan data dictionaries for believable generation. Hand-curated (no faker)
// to keep names, places, crops, and voice authentic to East African farming and
// the UmojaHub education hub.

export interface NamePart {
  name: string;
  gender: 'm' | 'f';
}

// First names with gender (for matching profile photos), spanning Kikuyu, Luo,
// Luhya, Kalenjin, Kamba, Somali, Coastal and other Kenyan communities.
export const FIRST_NAMES: NamePart[] = [
  { name: 'Wanjiku', gender: 'f' }, { name: 'Njeri', gender: 'f' },
  { name: 'Achieng', gender: 'f' }, { name: 'Akinyi', gender: 'f' },
  { name: 'Chebet', gender: 'f' }, { name: 'Jepkosgei', gender: 'f' },
  { name: 'Fatuma', gender: 'f' }, { name: 'Amina', gender: 'f' },
  { name: 'Mumbi', gender: 'f' }, { name: 'Nyambura', gender: 'f' },
  { name: 'Wairimu', gender: 'f' }, { name: 'Atieno', gender: 'f' },
  { name: 'Kavata', gender: 'f' }, { name: 'Mwende', gender: 'f' },
  { name: 'Halima', gender: 'f' }, { name: 'Naliaka', gender: 'f' },
  { name: 'Kipchoge', gender: 'm' }, { name: 'Kiprono', gender: 'm' },
  { name: 'Otieno', gender: 'm' }, { name: 'Onyango', gender: 'm' },
  { name: 'Njoroge', gender: 'm' }, { name: 'Kamau', gender: 'm' },
  { name: 'Mwangi', gender: 'm' }, { name: 'Githinji', gender: 'm' },
  { name: 'Mutua', gender: 'm' }, { name: 'Kilonzo', gender: 'm' },
  { name: 'Wekesa', gender: 'm' }, { name: 'Barasa', gender: 'm' },
  { name: 'Abdullahi', gender: 'm' }, { name: 'Hassan', gender: 'm' },
  { name: 'Brian', gender: 'm' }, { name: 'Dennis', gender: 'm' },
  { name: 'Kevin', gender: 'm' }, { name: 'Felix', gender: 'm' },
];

export const LAST_NAMES: string[] = [
  'Kamau', 'Mwangi', 'Otieno', 'Ochieng', 'Wanjala', 'Kiprotich', 'Mutiso',
  'Njoroge', 'Githinji', 'Achieng', 'Barasa', 'Wekesa', 'Korir', 'Cheruiyot',
  'Mwende', 'Kilonzo', 'Abdi', 'Hassan', 'Omondi', 'Owino', 'Karanja',
  'Nderitu', 'Maina', 'Chebii', 'Rotich', 'Wafula', 'Onyango', 'Kibet',
];

// Counties weighted toward agricultural heartlands.
export const FARMING_COUNTIES: string[] = [
  'Nakuru', 'Nyeri', 'Meru', 'Kiambu', 'Uasin Gishu', 'Trans Nzoia', 'Kisii',
  'Kirinyaga', 'Embu', 'Machakos', 'Bomet', 'Kericho', 'Nyandarua', 'Bungoma',
];

export const URBAN_COUNTIES: string[] = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'];

export interface Crop {
  name: string;
  unit: 'KG' | 'BAG' | 'CRATE' | 'LITRE' | 'PIECE';
  priceMin: number; // KES per unit
  priceMax: number;
  imageKey: string;
}

export const CROPS: Crop[] = [
  { name: 'Tomatoes', unit: 'CRATE', priceMin: 2500, priceMax: 4500, imageKey: 'tomatoes' },
  { name: 'Maize', unit: 'BAG', priceMin: 3000, priceMax: 4800, imageKey: 'maize' },
  { name: 'Potatoes', unit: 'BAG', priceMin: 1800, priceMax: 3200, imageKey: 'potatoes' },
  { name: 'Kale (Sukuma Wiki)', unit: 'KG', priceMin: 40, priceMax: 90, imageKey: 'kale' },
  { name: 'Onions', unit: 'BAG', priceMin: 2200, priceMax: 4000, imageKey: 'onions' },
  { name: 'Cabbages', unit: 'PIECE', priceMin: 30, priceMax: 80, imageKey: 'cabbage' },
  { name: 'French Beans', unit: 'KG', priceMin: 90, priceMax: 160, imageKey: 'beans' },
  { name: 'Avocados', unit: 'CRATE', priceMin: 1500, priceMax: 3500, imageKey: 'avocado' },
  { name: 'Bananas', unit: 'BAG', priceMin: 800, priceMax: 1800, imageKey: 'banana' },
  { name: 'Carrots', unit: 'BAG', priceMin: 1500, priceMax: 2800, imageKey: 'carrots' },
  { name: 'Green Grams (Ndengu)', unit: 'BAG', priceMin: 6000, priceMax: 9500, imageKey: 'grains' },
  { name: 'Milk', unit: 'LITRE', priceMin: 45, priceMax: 70, imageKey: 'milk' },
];

// Farmer-voice listing descriptions. {crop} and {county} are interpolated.
export const LISTING_TEMPLATES: string[] = [
  'Fresh {crop} harvested this week from my farm in {county}. Grown without excess chemicals, picked at the right maturity. Serious buyers welcome, bulk available.',
  'Good quality {crop} ready for collection in {county}. I have been farming this for years and my regular buyers know the quality. Can arrange transport for large orders.',
  '{crop} direct from the farm, no middlemen. Clean and well sorted. I supply hotels and grocers around {county}. Price is negotiable for repeat buyers.',
  'This season my {crop} has done very well. Healthy crop, good size. Located in {county}, easy pickup along the main road. Order early before it finishes.',
  'Selling {crop} in bulk from {county}. Carefully graded and packed. I prefer buyers who collect, but delivery within town can be arranged. Quality guaranteed.',
];

export const KENYAN_UNIVERSITIES: Array<{ name: string; county: string; domains: string[] }> = [
  { name: 'University of Nairobi', county: 'Nairobi', domains: ['students.uonbi.ac.ke', 'uonbi.ac.ke'] },
  { name: 'Jomo Kenyatta University of Agriculture and Technology', county: 'Kiambu', domains: ['students.jkuat.ac.ke', 'jkuat.ac.ke'] },
  { name: 'Moi University', county: 'Uasin Gishu', domains: ['students.mu.ac.ke', 'mu.ac.ke'] },
  { name: 'Kenyatta University', county: 'Kiambu', domains: ['students.ku.ac.ke', 'ku.ac.ke'] },
  { name: 'Strathmore University', county: 'Nairobi', domains: ['strathmore.edu'] },
  { name: 'Dedan Kimathi University of Technology', county: 'Nyeri', domains: ['students.dkut.ac.ke', 'dkut.ac.ke'] },
];

export const NGO_NAMES: Array<{ name: string; focus: string[] }> = [
  { name: 'Mazingira Green Initiative', focus: ['Sustainable farming', 'Climate resilience'] },
  { name: 'Shamba Trust', focus: ['Smallholder finance', 'Market access'] },
  { name: 'Pamoja Agricultural Foundation', focus: ['Cooperative development', 'Food security'] },
  { name: 'Tujenge Rural Development', focus: ['Women in agriculture', 'Training'] },
];

export const EMPLOYERS: Array<{ name: string; industry: string }> = [
  { name: 'Twiga Foods', industry: 'AgriTech / Logistics' },
  { name: 'Cellulant', industry: 'FinTech' },
  { name: 'M-KOPA', industry: 'FinTech / Hardware' },
  { name: 'Sendy', industry: 'Logistics' },
  { name: 'Andela Kenya', industry: 'Software / Talent' },
];

export const TECH_STACKS: string[] = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Django', 'Flutter',
  'React Native', 'PostgreSQL', 'MongoDB', 'Firebase', 'Go', 'Java', 'Spring',
  'TailwindCSS', 'Express', 'FastAPI', 'GraphQL', 'Docker', 'Kotlin',
];

export const SKILL_CATEGORIES: Record<string, string> = {
  React: 'Frontend', 'Next.js': 'Frontend', TypeScript: 'Languages', TailwindCSS: 'Frontend',
  'Node.js': 'Backend', Express: 'Backend', Django: 'Backend', FastAPI: 'Backend',
  Python: 'Languages', Go: 'Languages', Java: 'Languages', Kotlin: 'Languages',
  PostgreSQL: 'Data', MongoDB: 'Data', Firebase: 'Data', GraphQL: 'Data',
  Flutter: 'Mobile', 'React Native': 'Mobile', Docker: 'DevOps', Spring: 'Backend',
};

// Project titles for the education hub, grounded in Kenyan problem domains.
export const PROJECT_TITLES: string[] = [
  'M-Pesa reconciliation dashboard for a farmers cooperative',
  'SMS-based market price alerts for smallholder farmers',
  'Offline-first inventory tracker for rural agrodealers',
  'Matatu route and fare planner for Nairobi commuters',
  'Clinic appointment booking system for a rural health centre',
  'Digital attendance for a TVET institution',
  'Water-point reporting tool for a county government',
  'Boda-boda delivery dispatch for small businesses',
  'Solar payment tracking for an off-grid energy startup',
  'Crop disease photo-diagnosis assistant',
  'Cooperative savings (chama) management app',
  'School fees payment and statement portal',
];

export const STUDENT_INTERESTS: string[] = [
  'Full-stack web development', 'Mobile app development', 'Data engineering',
  'FinTech', 'AgriTech', 'DevOps', 'AI/ML', 'Backend systems',
];

export const DEPARTMENTS: string[] = [
  'School of Computing and Informatics', 'Department of Computer Science',
  'Faculty of Information Technology', 'School of Engineering',
];

export const FARMER_BIOS: string[] = [
  'Smallholder farmer focused on horticulture. Supplying fresh produce to local markets for over a decade.',
  'Mixed farming on a family plot. Proud member of my local cooperative and always learning better methods.',
  'Commercial vegetable farmer working with hotels and grocers. Quality and reliability are my reputation.',
  'Young farmer using better seed and smart irrigation to get more from a small piece of land.',
];

export const BUYER_ORGS: string[] = [
  'Mama Ngina Greengrocers', 'Savannah Hotel Group', 'FreshMart Supermarkets',
  'Nairobi Java Kitchens', 'Coast Catering Services', 'Highlands Produce Distributors',
];
