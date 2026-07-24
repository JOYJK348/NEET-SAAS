/**
 * SEED MODULE 06: Complete Official Syllabus Curriculum
 * NEET + JEE with real syllabus hierarchy, chapters, topics, and content
 */

import { SeedContext } from '../seed-review-academy';

// ═══════════════════════════════════════════════════════════════════════════════
// NEET PHYSICS — Official NTA/NMC Syllabus (Class 11 + 12)
// ═══════════════════════════════════════════════════════════════════════════════

export const NEET_PHYSICS_SYLLABUS = [
  {
    code: 'NEET-PHY-01', name: 'Units and Measurements', shortName: 'Units & Measurements',
    plannedHours: 12, estimatedSessions: 6,
    topics: [
      { code: 'NEET-PHY-01-T01', name: 'Units and Systems of Measurement', shortName: 'Units & Systems', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-01-T02', name: 'SI Units and Fundamental Quantities', shortName: 'SI Units', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-01-T03', name: 'Derived Units and Dimensional Analysis', shortName: 'Dimensional Analysis', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-01-T04', name: 'Significant Figures and Error Analysis', shortName: 'Errors & Sig Figs', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-01-T05', name: 'Dimensions of Physical Quantities', shortName: 'Dimensions', difficulty: 'MEDIUM', hours: 2, sessions: 1 },
    ]
  },
  {
    code: 'NEET-PHY-02', name: 'Motion in a Straight Line', shortName: '1D Motion',
    plannedHours: 14, estimatedSessions: 7,
    topics: [
      { code: 'NEET-PHY-02-T01', name: 'Introduction to Kinematics', shortName: 'Kinematics Intro', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T02', name: 'Position, Path Length and Displacement', shortName: 'Position & Displacement', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T03', name: 'Average Velocity and Instantaneous Velocity', shortName: 'Velocity', difficulty: 'MEDIUM', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T04', name: 'Average Acceleration and Instantaneous Acceleration', shortName: 'Acceleration', difficulty: 'MEDIUM', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T05', name: 'Equations of Motion with Constant Acceleration', shortName: 'Equations of Motion', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-02-T06', name: 'Relative Velocity and Graphical Analysis', shortName: 'Relative Velocity', difficulty: 'HARD', hours: 3, sessions: 2 },
    ]
  },
  {
    code: 'NEET-PHY-03', name: 'Motion in a Plane', shortName: '2D Motion',
    plannedHours: 16, estimatedSessions: 8,
    topics: [
      { code: 'NEET-PHY-03-T01', name: 'Scalars and Vectors', shortName: 'Vectors Intro', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-03-T02', name: 'Vector Addition and Subtraction', shortName: 'Vector Algebra', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-03-T03', name: 'Resolution of Vectors and Unit Vectors', shortName: 'Vector Resolution', difficulty: 'MEDIUM', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-03-T04', name: 'Projectile Motion', shortName: 'Projectile', difficulty: 'HARD', hours: 4, sessions: 2 },
      { code: 'NEET-PHY-03-T05', name: 'Uniform Circular Motion', shortName: 'Circular Motion', difficulty: 'HARD', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-03-T06', name: 'Relative Velocity in Two Dimensions', shortName: '2D Relative Velocity', difficulty: 'HARD', hours: 2, sessions: 1 },
    ]
    code: 'NEET-PHY-02', name: 'Motion in a Straight Line', shortName: '1D Motion',
    plannedHours: 14, estimatedSessions: 7,
    topics: [
      { code: 'NEET-PHY-02-T01', name: 'Introduction to Kinematics', shortName: 'Kinematics Intro', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T02', name: 'Position, Path Length and Displacement', shortName: 'Position & Displacement', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T03', name: 'Average Velocity and Instantaneous Velocity', shortName: 'Velocity', difficulty: 'MEDIUM', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T04', name: 'Average Acceleration and Instantaneous Acceleration', shortName: 'Acceleration', difficulty: 'MEDIUM', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-02-T05', name: 'Equations of Motion with Constant Acceleration', shortName: 'Equations of Motion', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-02-T06', name: 'Relative Velocity and Graphical Analysis', shortName: 'Relative Velocity', difficulty: 'HARD', hours: 3, sessions: 2 },
    ]
  },
  {
    code: 'NEET-PHY-03', name: 'Motion in a Plane', shortName: '2D Motion',
    plannedHours: 16, estimatedSessions: 8,
    topics: [
      { code: 'NEET-PHY-03-T01', name: 'Scalars and Vectors', shortName: 'Vectors Intro', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-03-T02', name: 'Vector Addition and Subtraction', shortName: 'Vector Algebra', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-03-T03', name: 'Resolution of Vectors and Unit Vectors', shortName: 'Vector Resolution', difficulty: 'MEDIUM', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-03-T04', name: 'Projectile Motion', shortName: 'Projectile', difficulty: 'HARD', hours: 4, sessions: 2 },
      { code: 'NEET-PHY-03-T05', name: 'Uniform Circular Motion', shortName: 'Circular Motion', difficulty: 'HARD', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-03-T06', name: 'Relative Velocity in Two Dimensions', shortName: '2D Relative Velocity', difficulty: 'HARD', hours: 2, sessions: 1 },
    ]
  },
  {
    code: 'NEET-PHY-04', name: 'Laws of Motion', shortName: 'Laws of Motion',
    plannedHours: 16, estimatedSessions: 8,
    topics: [
      { code: 'NEET-PHY-04-T01', name: "Newton's First Law and Inertia", shortName: 'First Law', difficulty: 'EASY', hours: 2, sessions: 1 },
      { code: 'NEET-PHY-04-T02', name: "Newton's Second Law and Momentum", shortName: 'Second Law', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-04-T03', name: "Newton's Third Law and Conservation of Momentum", shortName: 'Third Law', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-04-T04', name: 'Friction: Static and Kinetic', shortName: 'Friction', difficulty: 'HARD', hours: 4, sessions: 2 },
      { code: 'NEET-PHY-04-T05', name: 'Circular Motion Dynamics and Banking', shortName: 'Banking of Roads', difficulty: 'HARD', hours: 4, sessions: 2 },
    ]
  },
  {
    code: 'NEET-PHY-05', name: 'Work, Energy and Power', shortName: 'Work & Energy',
    plannedHours: 14, estimatedSessions: 7,
    topics: [
      { code: 'NEET-PHY-05-T01', name: 'Work Done by Constant and Variable Forces', shortName: 'Work Done', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-05-T02', name: 'Kinetic Energy and Work-Energy Theorem', shortName: 'KE & Work-Energy', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-05-T03', name: 'Potential Energy and Conservative Forces', shortName: 'Potential Energy', difficulty: 'MEDIUM', hours: 3, sessions: 2 },
      { code: 'NEET-PHY-05-T04', name: 'Conservation of Mechanical Energy', shortName: 'Energy Conservation', difficulty: 'HARD', hours: 3, sessions: 2 },
