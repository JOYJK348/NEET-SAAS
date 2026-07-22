import { prisma, DEMO_TENANT_ID, DEMO_BRANCH_ID, SYSTEM_USER_ID, DEFAULT_DELETED_AT } from './helpers';

const ACADEMIC_YEAR_ID = '00000000-0000-0000-0000-000000000005';
const SIVAKASI_BRANCH_ID = '00000000-0000-0000-0000-000000000006';
const PHYSICS_SUBJECT_ID = '00000000-0000-0000-0000-000000000010';
const CHEMISTRY_SUBJECT_ID = '00000000-0000-0000-0000-000000000011';
const BIOLOGY_SUBJECT_ID = '00000000-0000-0000-0000-000000000012';
const COURSE_ID = '00000000-0000-0000-0000-000000000020';
const COURSE_SUBJECT_PHYSICS_ID = '00000000-0000-0000-0000-000000000030';
const COURSE_SUBJECT_CHEMISTRY_ID = '00000000-0000-0000-0000-000000000031';
const COURSE_SUBJECT_BIOLOGY_ID = '00000000-0000-0000-0000-000000000032';

let nextChapterId = 100;
let nextTopicId = 1000;

function chId(): string {
  return `00000000-0000-0000-0000-0000${nextChapterId++.toString().padStart(12, '0')}`;
}

function tpId(): string {
  return `00000000-0000-0000-0000-0000${nextTopicId++.toString().padStart(12, '0')}`;
}

interface TopicSeed {
  name: string;
  code: string;
}

interface ChapterSeed {
  name: string;
  code: string;
  shortName: string;
  plannedHours: number;
  estimatedSessions: number;
  topics: TopicSeed[];
}

interface SubjectChapters {
  subjectName: string;
  courseSubjectId: string;
  chapters: ChapterSeed[];
}

const physicsChapters: ChapterSeed[] = [
  {
    name: 'Physics and Measurement', code: 'PHY-01', shortName: 'Measurement',
    plannedHours: 12, estimatedSessions: 8,
    topics: [
      { name: 'Units and Systems of Measurement', code: 'PHY-01-01' },
      { name: 'SI Units and Derived Units', code: 'PHY-01-02' },
      { name: 'Dimensions of Physical Quantities', code: 'PHY-01-03' },
      { name: 'Significant Figures', code: 'PHY-01-04' },
      { name: 'Errors in Measurement', code: 'PHY-01-05' },
      { name: 'Dimensional Analysis and Applications', code: 'PHY-01-06' },
    ],
  },
  {
    name: 'Kinematics', code: 'PHY-02', shortName: 'Kinematics',
    plannedHours: 20, estimatedSessions: 14,
    topics: [
      { name: 'Frame of Reference', code: 'PHY-02-01' },
      { name: 'Motion in a Straight Line', code: 'PHY-02-02' },
      { name: 'Position-Time Graphs', code: 'PHY-02-03' },
      { name: 'Speed and Velocity', code: 'PHY-02-04' },
      { name: 'Uniform and Non-Uniform Motion', code: 'PHY-02-05' },
      { name: 'Acceleration', code: 'PHY-02-06' },
      { name: 'Motion Under Uniform Acceleration', code: 'PHY-02-07' },
      { name: 'Scalars and Vectors', code: 'PHY-02-08' },
      { name: 'Vector Addition and Subtraction', code: 'PHY-02-09' },
      { name: 'Resolution of Vectors', code: 'PHY-02-10' },
      { name: 'Relative Velocity', code: 'PHY-02-11' },
      { name: 'Motion in a Plane', code: 'PHY-02-12' },
      { name: 'Projectile Motion', code: 'PHY-02-13' },
      { name: 'Uniform Circular Motion', code: 'PHY-02-14' },
    ],
  },
  {
    name: 'Laws of Motion', code: 'PHY-03', shortName: 'Laws of Motion',
    plannedHours: 16, estimatedSessions: 10,
    topics: [
      { name: 'Force and Inertia', code: 'PHY-03-01' },
      { name: "Newton's First Law of Motion", code: 'PHY-03-02' },
      { name: "Newton's Second Law of Motion", code: 'PHY-03-03' },
      { name: 'Momentum and Impulse', code: 'PHY-03-04' },
      { name: "Newton's Third Law of Motion", code: 'PHY-03-05' },
      { name: 'Conservation of Linear Momentum', code: 'PHY-03-06' },
      { name: 'Equilibrium of Concurrent Forces', code: 'PHY-03-07' },
      { name: 'Friction', code: 'PHY-03-08' },
      { name: 'Centripetal Force', code: 'PHY-03-09' },
      { name: 'Applications of Laws of Motion', code: 'PHY-03-10' },
    ],
  },
  {
    name: 'Work, Energy and Power', code: 'PHY-04', shortName: 'Work Energy',
    plannedHours: 14, estimatedSessions: 8,
    topics: [
      { name: 'Work Done by Constant Force', code: 'PHY-04-01' },
      { name: 'Work Done by Variable Force', code: 'PHY-04-02' },
      { name: 'Kinetic Energy', code: 'PHY-04-03' },
      { name: 'Potential Energy', code: 'PHY-04-04' },
      { name: 'Work-Energy Theorem', code: 'PHY-04-05' },
      { name: 'Power', code: 'PHY-04-06' },
      { name: 'Conservation of Mechanical Energy', code: 'PHY-04-07' },
      { name: 'Collisions', code: 'PHY-04-08' },
    ],
  },
  {
    name: 'Rotational Motion', code: 'PHY-05', shortName: 'Rotational Motion',
    plannedHours: 14, estimatedSessions: 8,
    topics: [
      { name: 'Centre of Mass', code: 'PHY-05-01' },
      { name: 'Motion of Centre of Mass', code: 'PHY-05-02' },
      { name: 'Torque', code: 'PHY-05-03' },
      { name: 'Angular Momentum', code: 'PHY-05-04' },
      { name: 'Conservation of Angular Momentum', code: 'PHY-05-05' },
      { name: 'Moment of Inertia', code: 'PHY-05-06' },
      { name: 'Radius of Gyration', code: 'PHY-05-07' },
      { name: 'Parallel and Perpendicular Axis Theorems', code: 'PHY-05-08' },
    ],
  },
  {
    name: 'Gravitation', code: 'PHY-06', shortName: 'Gravitation',
    plannedHours: 12, estimatedSessions: 8,
    topics: [
      { name: 'Universal Law of Gravitation', code: 'PHY-06-01' },
      { name: 'Acceleration Due to Gravity', code: 'PHY-06-02' },
      { name: 'Variation of g with Height and Depth', code: 'PHY-06-03' },
      { name: 'Gravitational Potential', code: 'PHY-06-04' },
      { name: 'Gravitational Potential Energy', code: 'PHY-06-05' },
      { name: 'Escape Velocity', code: 'PHY-06-06' },
      { name: 'Orbital Velocity', code: 'PHY-06-07' },
      { name: 'Satellites', code: 'PHY-06-08' },
      { name: "Kepler's Laws of Planetary Motion", code: 'PHY-06-09' },
    ],
  },
];

const chemistryChapters: ChapterSeed[] = [
  {
    name: 'Some Basic Concepts of Chemistry', code: 'CHEM-01', shortName: 'Basic Concepts',
    plannedHours: 12, estimatedSessions: 8,
    topics: [
      { name: 'Nature of Matter', code: 'CHEM-01-01' },
      { name: 'Atomic and Molecular Masses', code: 'CHEM-01-02' },
      { name: 'Mole Concept and Molar Masses', code: 'CHEM-01-03' },
      { name: 'Percentage Composition and Empirical Formula', code: 'CHEM-01-04' },
      { name: 'Stoichiometry and Stoichiometric Calculations', code: 'CHEM-01-05' },
      { name: 'Limiting Reagent', code: 'CHEM-01-06' },
      { name: 'Concentration Terms', code: 'CHEM-01-07' },
    ],
  },
  {
    name: 'Atomic Structure', code: 'CHEM-02', shortName: 'Atomic Structure',
    plannedHours: 14, estimatedSessions: 10,
    topics: [
      { name: 'Subatomic Particles', code: 'CHEM-02-01' },
      { name: 'Atomic Models - Thomson, Rutherford, Bohr', code: 'CHEM-02-02' },
      { name: 'Bohr Model of Hydrogen Atom', code: 'CHEM-02-03' },
      { name: 'Quantum Mechanical Model', code: 'CHEM-02-04' },
      { name: 'Quantum Numbers', code: 'CHEM-02-05' },
      { name: 'Aufbau Principle and Pauli Exclusion Principle', code: 'CHEM-02-06' },
      { name: "Hund's Rule and Electronic Configuration", code: 'CHEM-02-07' },
    ],
  },
  {
    name: 'Chemical Bonding and Molecular Structure', code: 'CHEM-03', shortName: 'Chemical Bonding',
    plannedHours: 16, estimatedSessions: 10,
    topics: [
      { name: 'Kossel-Lewis Approach to Chemical Bonding', code: 'CHEM-03-01' },
      { name: 'Ionic Bond', code: 'CHEM-03-02' },
      { name: 'Covalent Bond', code: 'CHEM-03-03' },
      { name: 'Bond Parameters', code: 'CHEM-03-04' },
      { name: 'VSEPR Theory', code: 'CHEM-03-05' },
      { name: 'Valence Bond Theory', code: 'CHEM-03-06' },
      { name: 'Hybridisation', code: 'CHEM-03-07' },
      { name: 'Molecular Orbital Theory', code: 'CHEM-03-08' },
      { name: 'Hydrogen Bonding', code: 'CHEM-03-09' },
    ],
  },
  {
    name: 'Thermodynamics', code: 'CHEM-04', shortName: 'Thermodynamics',
    plannedHours: 14, estimatedSessions: 8,
    topics: [
      { name: 'Thermodynamic Terms and Concepts', code: 'CHEM-04-01' },
      { name: 'First Law of Thermodynamics', code: 'CHEM-04-02' },
      { name: 'Enthalpy and Enthalpy Change', code: 'CHEM-04-03' },
      { name: 'Hess Law of Constant Heat Summation', code: 'CHEM-04-04' },
      { name: 'Spontaneity and Gibbs Energy', code: 'CHEM-04-05' },
      { name: 'Second and Third Laws of Thermodynamics', code: 'CHEM-04-06' },
    ],
  },
  {
    name: 'Equilibrium', code: 'CHEM-05', shortName: 'Equilibrium',
    plannedHours: 16, estimatedSessions: 10,
    topics: [
      { name: 'Equilibrium in Physical Processes', code: 'CHEM-05-01' },
      { name: 'Law of Chemical Equilibrium', code: 'CHEM-05-02' },
      { name: 'Equilibrium Constant', code: 'CHEM-05-03' },
      { name: 'Factors Affecting Equilibrium - Le Chatelier Principle', code: 'CHEM-05-04' },
      { name: 'Ionic Equilibrium', code: 'CHEM-05-05' },
      { name: 'Acids, Bases and pH', code: 'CHEM-05-06' },
      { name: 'Buffer Solutions', code: 'CHEM-05-07' },
      { name: 'Solubility and Solubility Product', code: 'CHEM-05-08' },
    ],
  },
  {
    name: 'Redox Reactions', code: 'CHEM-06', shortName: 'Redox',
    plannedHours: 10, estimatedSessions: 6,
    topics: [
      { name: 'Classical Idea of Oxidation and Reduction', code: 'CHEM-06-01' },
      { name: 'Oxidation Number and State', code: 'CHEM-06-02' },
      { name: 'Balancing Redox Reactions', code: 'CHEM-06-03' },
      { name: 'Electrochemical Cells', code: 'CHEM-06-04' },
      { name: 'Standard Electrode Potential', code: 'CHEM-06-05' },
      { name: 'Nernst Equation', code: 'CHEM-06-06' },
    ],
  },
];

const biologyChapters: ChapterSeed[] = [
  {
    name: 'Diversity in Living World', code: 'BIO-01', shortName: 'Diversity',
    plannedHours: 14, estimatedSessions: 8,
    topics: [
      { name: 'What is Living? Characteristics of Life', code: 'BIO-01-01' },
      { name: 'Biological Classification - Five Kingdom System', code: 'BIO-01-02' },
      { name: 'Kingdom Plantae', code: 'BIO-01-03' },
      { name: 'Kingdom Animalia', code: 'BIO-01-04' },
      { name: 'Taxonomy and Systematics', code: 'BIO-01-05' },
    ],
  },
  {
    name: 'Structural Organisation in Plants and Animals', code: 'BIO-02', shortName: 'Structural Organisation',
    plannedHours: 14, estimatedSessions: 8,
    topics: [
      { name: 'Plant Tissues - Meristematic and Permanent', code: 'BIO-02-01' },
      { name: 'Animal Tissues - Epithelial, Connective, Muscular, Neural', code: 'BIO-02-02' },
      { name: 'Morphology of Flowering Plants - Root, Stem, Leaf', code: 'BIO-02-03' },
      { name: 'Morphology of Flowering Plants - Flower, Fruit, Seed', code: 'BIO-02-04' },
      { name: 'Anatomy of Flowering Plants', code: 'BIO-02-05' },
      { name: 'Earthworm and Frog Morphology and Anatomy', code: 'BIO-02-06' },
    ],
  },
  {
    name: 'Cell Structure and Function', code: 'BIO-03', shortName: 'Cell Biology',
    plannedHours: 16, estimatedSessions: 10,
    topics: [
      { name: 'Cell Theory and Overview of Cell', code: 'BIO-03-01' },
      { name: 'Prokaryotic and Eukaryotic Cells', code: 'BIO-03-02' },
      { name: 'Cell Membrane and Cell Wall', code: 'BIO-03-03' },
      { name: 'Cell Organelles - Structure and Function', code: 'BIO-03-04' },
      { name: 'Cell Division - Mitosis and Meiosis', code: 'BIO-03-05' },
      { name: 'Biomolecules - Proteins, Carbohydrates, Lipids, Nucleic Acids', code: 'BIO-03-06' },
      { name: 'Enzymes', code: 'BIO-03-07' },
    ],
  },
  {
    name: 'Plant Physiology', code: 'BIO-04', shortName: 'Plant Physiology',
    plannedHours: 16, estimatedSessions: 10,
    topics: [
      { name: 'Transport in Plants - Xylem and Phloem', code: 'BIO-04-01' },
      { name: 'Transpiration and Ascent of Sap', code: 'BIO-04-02' },
      { name: 'Photosynthesis - Light and Dark Reactions', code: 'BIO-04-03' },
      { name: 'Factors Affecting Photosynthesis', code: 'BIO-04-04' },
      { name: 'Respiration in Plants - Aerobic and Anaerobic', code: 'BIO-04-05' },
      { name: 'Plant Growth and Development - Hormones', code: 'BIO-04-06' },
      { name: 'Photoperiodism and Vernalisation', code: 'BIO-04-07' },
    ],
  },
  {
    name: 'Human Physiology', code: 'BIO-05', shortName: 'Human Physiology',
    plannedHours: 20, estimatedSessions: 14,
    topics: [
      { name: 'Digestion and Absorption', code: 'BIO-05-01' },
      { name: 'Breathing and Exchange of Gases', code: 'BIO-05-02' },
      { name: 'Body Fluids and Circulation', code: 'BIO-05-03' },
      { name: 'Excretory Products and Their Elimination', code: 'BIO-05-04' },
      { name: 'Locomotion and Movement', code: 'BIO-05-05' },
      { name: 'Neural Control and Coordination', code: 'BIO-05-06' },
      { name: 'Chemical Coordination and Integration', code: 'BIO-05-07' },
    ],
  },
  {
    name: 'Reproduction', code: 'BIO-06', shortName: 'Reproduction',
    plannedHours: 16, estimatedSessions: 10,
    topics: [
      { name: 'Reproduction in Organisms - Asexual and Sexual', code: 'BIO-06-01' },
      { name: 'Sexual Reproduction in Flowering Plants', code: 'BIO-06-02' },
      { name: 'Human Reproductive System', code: 'BIO-06-03' },
      { name: 'Gametogenesis and Fertilisation', code: 'BIO-06-04' },
      { name: 'Embryonic Development and Pregnancy', code: 'BIO-06-05' },
      { name: 'Reproductive Health and Contraception', code: 'BIO-06-06' },
    ],
  },
];

const subjectData: SubjectChapters[] = [
  { subjectName: 'Physics', courseSubjectId: COURSE_SUBJECT_PHYSICS_ID, chapters: physicsChapters },
  { subjectName: 'Chemistry', courseSubjectId: COURSE_SUBJECT_CHEMISTRY_ID, chapters: chemistryChapters },
  { subjectName: 'Biology', courseSubjectId: COURSE_SUBJECT_BIOLOGY_ID, chapters: biologyChapters },
];

const subjectIds: Record<string, string> = {
  Physics: PHYSICS_SUBJECT_ID,
  Chemistry: CHEMISTRY_SUBJECT_ID,
  Biology: BIOLOGY_SUBJECT_ID,
};

export async function seedCourses(): Promise<void> {
  const now = new Date();
  const startDate = new Date('2026-04-01');
  const endDate = new Date('2027-03-31');

  const academicYear = await prisma.academicYears.upsert({
    where: { id: ACADEMIC_YEAR_ID },
    update: {
      name: 'Academic Year 2026-27',
      description: 'Academic Year April 2026 - March 2027',
      startDate,
      endDate,
      isCurrent: true,
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: ACADEMIC_YEAR_ID,
      tenantId: DEMO_TENANT_ID,
      code: 'AY-2026-27',
      name: 'Academic Year 2026-27',
      description: 'Academic Year April 2026 - March 2027',
      startDate,
      endDate,
      isCurrent: true,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  const sivakasiBranch = await prisma.branches.upsert({
    where: { id: SIVAKASI_BRANCH_ID },
    update: {
      code: 'SVK-001',
      slug: 'sivakasi',
      name: 'Sivakasi',
      displayName: 'Sivakasi Centre',
      email: 'sivakasi@demo.com',
      phone: '+91-9876543211',
      branchType: 'CAMPUS',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      academicYearId: academicYear.id,
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: SIVAKASI_BRANCH_ID,
      tenantId: DEMO_TENANT_ID,
      code: 'SVK-001',
      slug: 'sivakasi',
      name: 'Sivakasi',
      displayName: 'Sivakasi Centre',
      email: 'sivakasi@demo.com',
      phone: '+91-9876543211',
      branchType: 'CAMPUS',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      academicYearId: academicYear.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  const physicsSubject = await prisma.subjects.upsert({
    where: { id: PHYSICS_SUBJECT_ID },
    update: {
      name: 'Physics',
      shortName: 'PHY',
      displayName: 'Physics',
      description: 'Physics - NEET Syllabus',
      subjectType: 'CORE',
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: PHYSICS_SUBJECT_ID,
      tenantId: DEMO_TENANT_ID,
      code: 'PHYSICS',
      name: 'Physics',
      shortName: 'PHY',
      displayName: 'Physics',
      description: 'Physics - NEET Syllabus',
      subjectType: 'CORE',
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  const chemistrySubject = await prisma.subjects.upsert({
    where: { id: CHEMISTRY_SUBJECT_ID },
    update: {
      name: 'Chemistry',
      shortName: 'CHEM',
      displayName: 'Chemistry',
      description: 'Chemistry - NEET Syllabus',
      subjectType: 'CORE',
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: CHEMISTRY_SUBJECT_ID,
      tenantId: DEMO_TENANT_ID,
      code: 'CHEMISTRY',
      name: 'Chemistry',
      shortName: 'CHEM',
      displayName: 'Chemistry',
      description: 'Chemistry - NEET Syllabus',
      subjectType: 'CORE',
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  const biologySubject = await prisma.subjects.upsert({
    where: { id: BIOLOGY_SUBJECT_ID },
    update: {
      name: 'Biology',
      shortName: 'BIO',
      displayName: 'Biology',
      description: 'Biology - NEET Syllabus',
      subjectType: 'CORE',
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: BIOLOGY_SUBJECT_ID,
      tenantId: DEMO_TENANT_ID,
      code: 'BIOLOGY',
      name: 'Biology',
      shortName: 'BIO',
      displayName: 'Biology',
      description: 'Biology - NEET Syllabus',
      subjectType: 'CORE',
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  const course = await prisma.courses.upsert({
    where: { id: COURSE_ID },
    update: {
      code: 'NEET-FDN-2627',
      name: 'NEET Foundation 2026-27',
      displayName: 'NEET Foundation 2026-27',
      description: 'Comprehensive NEET Foundation course covering Physics, Chemistry and Biology as per the official NEET 2026 syllabus. Designed for Class 9 & 10 early preparation.',
      courseType: 'REGULAR',
      durationMonths: 12,
      startDate,
      endDate,
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: COURSE_ID,
      tenantId: DEMO_TENANT_ID,
      code: 'NEET-FDN-2627',
      name: 'NEET Foundation 2026-27',
      displayName: 'NEET Foundation 2026-27',
      description: 'Comprehensive NEET Foundation course covering Physics, Chemistry and Biology as per the official NEET 2026 syllabus.',
      courseType: 'REGULAR',
      durationMonths: 12,
      startDate,
      endDate,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await prisma.branchCourses.upsert({
    where: {
      tenantId_branchId_courseId_academicYearId: {
        tenantId: DEMO_TENANT_ID,
        branchId: sivakasiBranch.id,
        courseId: course.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      tenantId: DEMO_TENANT_ID,
      branchId: sivakasiBranch.id,
      courseId: course.id,
      academicYearId: academicYear.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await prisma.branchCourses.upsert({
    where: {
      tenantId_branchId_courseId_academicYearId: {
        tenantId: DEMO_TENANT_ID,
        branchId: DEMO_BRANCH_ID,
        courseId: course.id,
        academicYearId: academicYear.id,
      },
    },
    update: {},
    create: {
      tenantId: DEMO_TENANT_ID,
      branchId: DEMO_BRANCH_ID,
      courseId: course.id,
      academicYearId: academicYear.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await seedSubjectChapters(course.id);
}

async function seedSubjectChapters(courseId: string): Promise<void> {
  for (const subj of subjectData) {
    const subjectId = subjectIds[subj.subjectName];
    const cs = await prisma.courseSubjects.upsert({
      where: { id: subj.courseSubjectId },
      update: {
        subjectId,
        updatedBy: SYSTEM_USER_ID,
      },
      create: {
        id: subj.courseSubjectId,
        tenantId: DEMO_TENANT_ID,
        courseId,
        subjectId,
        displayOrder: 1,
        isMandatory: true,
        totalMarks: 180,
        passingMarks: 72,
        credits: 4,
        plannedHours: 100,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        deletedAt: null,
        deletedBy: null,
      },
    });

    for (let ci = 0; ci < subj.chapters.length; ci++) {
      const ch = subj.chapters[ci];
      const chapterId = chId();
      const chapter = await prisma.chapters.upsert({
        where: { id: chapterId },
        update: {
          name: ch.name,
          shortName: ch.shortName,
          description: `${ch.name} - NEET syllabus chapter`,
          plannedHours: ch.plannedHours,
          estimatedSessions: ch.estimatedSessions,
          displayOrder: ci + 1,
          updatedBy: SYSTEM_USER_ID,
        },
        create: {
          id: chapterId,
          tenantId: DEMO_TENANT_ID,
          courseSubjectId: cs.id,
          code: ch.code,
          name: ch.name,
          shortName: ch.shortName,
          description: `${ch.name} - NEET syllabus chapter`,
          plannedHours: ch.plannedHours,
          estimatedSessions: ch.estimatedSessions,
          displayOrder: ci + 1,
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
          deletedAt: null,
          deletedBy: null,
        },
      });

      for (let ti = 0; ti < ch.topics.length; ti++) {
        const tp = ch.topics[ti];
        const topicId = tpId();
        await prisma.topics.upsert({
          where: { id: topicId },
          update: {
            name: tp.name,
            description: `${tp.name} - NEET syllabus topic`,
            learningObjectives: `Understand and apply concepts of ${tp.name}`,
            displayOrder: ti + 1,
            updatedBy: SYSTEM_USER_ID,
          },
          create: {
            id: topicId,
            tenantId: DEMO_TENANT_ID,
            chapterId: chapter.id,
            code: tp.code,
            name: tp.name,
            shortName: tp.name.length > 30 ? tp.name.substring(0, 30) : tp.name,
            description: `${tp.name} - NEET syllabus topic`,
            learningObjectives: `Understand and apply concepts of ${tp.name}`,
            difficultyLevel: 'MEDIUM',
            plannedHours: 2,
            plannedSessions: 1,
            displayOrder: ti + 1,
            createdBy: SYSTEM_USER_ID,
            updatedBy: SYSTEM_USER_ID,
            deletedAt: null,
            deletedBy: null,
          },
        });
      }
    }
  }
}
