'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

type ModalType = 
  | 'profile'
  | 'accountSettings'
  | 'transaction'
  | 'asset'
  | 'liability'
  | 'recurring'
  | 'ai-chat'
  | null;

interface ModalState {
  type: ModalType;
  data?: Record<string, unknown>;
}

interface ModalContextValue {
  modalState: ModalState;
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  isModalOpen: (type: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const openModal = useCallback((type: ModalType, data?: Record<string, unknown>) => {
    setModalState({ type, data });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ type: null });
  }, []);

  const isModalOpen = useCallback((type: ModalType) => {
    return modalState.type === type;
  }, [modalState.type]);

  const value = useMemo(() => ({
    modalState,
    openModal,
    closeModal,
    isModalOpen,
  }), [modalState, openModal, closeModal, isModalOpen]);

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

