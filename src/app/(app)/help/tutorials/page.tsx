'use client';

import { AppLayout } from '@/components/layout';
import CourseExperience from '@/components/courses/CourseExperience';
import { appTutorialCourse } from '@/components/courses/appTutorialCourseData';
import { useMonth } from '@/context/MonthContext';

export default function TutorialsPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="סרטוני הדרכה"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
      showQuickAddFab={false}
    >
      <CourseExperience
        course={appTutorialCourse}
        variant="appTutorials"
        storageKey="myneto-watched-app-tutorials"
      />
    </AppLayout>
  );
}
