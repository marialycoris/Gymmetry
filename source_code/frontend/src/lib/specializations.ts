export interface SpecializationOption {
  title: string;
  description: string;
  capacity: number;
}

export const OTHER_SPECIALIZATION = 'Other';

export const SPECIALIZATIONS: SpecializationOption[] = [
  {
    title: 'Strength and Conditioning',
    description: 'Focuses on maximizing athletic performance, power, speed, and sports-specific conditioning.',
    capacity: 3,
  },
  {
    title: 'Fitness Nutrition / Nutrition Coaching',
    description: 'Guides clients on meal planning, macro tracking, weight management, and sustainable dietary habits.',
    capacity: 1,
  },
  {
    title: 'Corrective Exercise Specialist (CES)',
    description: 'Assesses movement compensations, fixes muscle imbalances, and reduces the risk of injury.',
    capacity: 1,
  },
  {
    title: 'Weight Management & Fat Loss',
    description: 'Targets metabolic conditioning, body composition changes, and behavioral support for clients losing weight.',
    capacity: 3,
  },
  {
    title: 'Senior Fitness',
    description: 'Tailors safe exercise programs for older adults to improve balance, bone density, joint health, and functional independence.',
    capacity: 4,
  },
  {
    title: 'Youth Fitness',
    description: 'Designs age-appropriate movement, coordination, and strength programs for children and adolescents.',
    capacity: 6,
  },
  {
    title: 'Group Exercise & Boot Camp',
    description: 'Teaches structured, high-energy classes or small-group training sessions for multiple participants at once.',
    capacity: 15,
  },
  {
    title: 'Bodybuilding / Physique Coaching',
    description: 'Prepares clients for aesthetic goals, muscle tone, or physique and bodybuilding competitions.',
    capacity: 2,
  },
];

export const DEFAULT_CAPACITY = 1;

export const specializationCapacity = (title: string) =>
  SPECIALIZATIONS.find((s) => s.title === title)?.capacity ?? DEFAULT_CAPACITY;
