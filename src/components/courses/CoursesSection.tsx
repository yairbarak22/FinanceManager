'use client';

import CourseExperience from './CourseExperience';
import { mockCourse } from './coursesData';

export default function CoursesSection() {
  return (
    <CourseExperience
      course={mockCourse}
      variant="investments"
      storageKey="myneto-watched-lessons"
    />
  );
}
