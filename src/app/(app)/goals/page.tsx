'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, Loader2 } from 'lucide-react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import { GoalSimulator, GoalCard, GoalModal } from '@/components/goals';
import { AppLayout } from '@/components/layout';
import { SectionHeader } from '@/components/dashboard';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';
import ToastContainer from '@/components/ui/Toast';
import { useMonth } from '@/context/MonthContext';
import { useModal } from '@/context/ModalContext';
import { useToast } from '@/hooks/useToast';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { FinancialGoal, UpdateGoalInput } from '@/lib/api/goals';

export default function GoalsPage() {
  const { data: goals, isLoading, error } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const analytics = useAnalytics();
  const hasTrackedPageView = useRef(false);
  
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();
  
  const { openModal, isModalOpen, closeModal } = useModal();
  const toast = useToast();
  
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<FinancialGoal | null>(null);

  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      analytics.trackGoalPageViewed();
      hasTrackedPageView.current = true;
    }
  }, [analytics]);

  const handleCreateGoal = async (goalData: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    icon: string;
  }) => {
    await createGoal.mutateAsync(goalData);
    // Track goal created
    analytics.trackGoalCreated(
      goalData.name,
      goalData.category,
      goalData.targetAmount,
      goalData.currentAmount,
      goalData.deadline,
      false, // investInPortfolio - default from basic create
    );
  };

  const handleEditGoal = async (goal: UpdateGoalInput) => {
    await updateGoal.mutateAsync(goal);
    // Track goal updated
    analytics.trackGoalUpdated(
      goal.id,
      goal.name || '',
      goal.category || '',
      goal.targetAmount || 0,
      goal.currentAmount || 0,
      goal.deadline || '',
    );
    setEditingGoal(null);
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    // Track goal deleted
    analytics.trackGoalDeleted(deletingGoal.id, deletingGoal.name);
    await deleteGoal.mutateAsync(deletingGoal.id);
    setDeletingGoal(null);
  };

  return (
    <AppLayout
      pageTitle="יעדים פיננסיים"
      pageSubtitle="תכנן את היעדים שלך ועקוב אחר ההתקדמות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
      showMonthFilter={false}
    >
      <div className="space-y-12 pb-12">
        {/* ============================================
            SECTION 1: My Goals (היעדים שלי)
            ============================================ */}
        <section>
          <SectionHeader
            title="היעדים שלי"
            subtitle="עקוב אחר ההתקדמות שלך לקראת השגת היעדים הפיננסיים שלך"
          />
          
          {isLoading ? (
            <Card className="p-8 flex items-center justify-center">
              <Loader2 
                className="w-8 h-8 animate-spin"
                style={{ color: '#69ADFF' }}
              />
            </Card>
          ) : error ? (
            <Card className="p-8 text-center">
              <p style={{ color: '#F18AB5' }}>שגיאה בטעינת היעדים</p>
            </Card>
          ) : !goals || goals.length === 0 ? (
            <Card className="p-8 text-center">
              <Target 
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: '#BDBDCB' }}
              />
              <p 
                className="text-lg font-medium mb-1"
                style={{ color: '#303150' }}
              >
                אין לך יעדים עדיין
              </p>
              <p style={{ color: '#7E7F90', fontSize: '0.875rem' }}>
                השתמש בסימולטור למטה כדי ליצור את היעד הראשון שלך
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={(g) => {
                    setEditingGoal(g);
                    analytics.trackGoalFormOpened('edit');
                  }}
                  onDelete={setDeletingGoal}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============================================
            SECTION 2: Goal Simulator (סימולטור יעדים)
            ============================================ */}
        <section>
          <SectionHeader
            title="הוסף יעד חדש"
            subtitle="השתמש בסימולטור כדי לתכנן יעד פיננסי חדש ולחשב את ההפרשה החודשית הנדרשת"
          />
          
          <GoalSimulator 
            onCreateGoal={handleCreateGoal}
            isCreating={createGoal.isPending}
            onSuccess={() => toast.success('היעד נוסף בהצלחה!')}
          />
        </section>

      {/* Edit Modal */}
      {editingGoal && (
        <GoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={handleEditGoal}
          goal={editingGoal}
          isSaving={updateGoal.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDeleteGoal}
        title="מחיקת יעד"
        message={deletingGoal ? `האם אתה בטוח שברצונך למחוק את היעד "${deletingGoal.name}"?` : ''}
      />
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isModalOpen('profile')}
        onClose={closeModal}
      />
      <AccountSettings
        isOpen={isModalOpen('accountSettings')}
        onClose={closeModal}
      />

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </AppLayout>
  );
}

