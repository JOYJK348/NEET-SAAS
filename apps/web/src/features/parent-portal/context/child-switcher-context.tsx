'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parentPortalService } from '../services/parent-portal-service';
import type { LinkedStudent } from '../types/parent-portal';
import { useAuth } from '@/providers/auth-provider';
import { STALE_TIMES } from '@/lib/staleTimes';

interface ChildSwitcherContextType {
  linkedStudents: LinkedStudent[];
  selectedChildId: string | null;
  selectedChild: LinkedStudent | null;
  setSelectedChildId: (id: string) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const ChildSwitcherContext = createContext<ChildSwitcherContextType | null>(null);

export function ChildSwitcherProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);

  const isParent = isAuthenticated && (user?.roleCode === 'PARENT' || (user as any)?.role === 'PARENT');

  const {
    data: linkedStudents = [],
    isLoading,
    refetch: queryRefetch,
  } = useQuery<LinkedStudent[]>({
    queryKey: ['parent', 'linked-students'],
    queryFn: () => parentPortalService.getLinkedStudents(),
    enabled: isParent,
    staleTime: STALE_TIMES.DEFAULT,
  });

  useEffect(() => {
    if (linkedStudents.length > 0 && !selectedChildId) {
      const savedChildId =
        typeof window !== 'undefined'
          ? localStorage.getItem('parent_portal_selected_child_id')
          : null;
      if (savedChildId && linkedStudents.some((s) => s.id === savedChildId)) {
        setSelectedChildIdState(savedChildId);
      } else {
        setSelectedChildIdState(linkedStudents[0].id);
      }
    }
  }, [linkedStudents, selectedChildId]);

  const setSelectedChildId = useCallback((id: string) => {
    setSelectedChildIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parent_portal_selected_child_id', id);
    }
  }, []);

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  const selectedChild =
    linkedStudents.find((s) => s.id === selectedChildId) || linkedStudents[0] || null;

  return (
    <ChildSwitcherContext.Provider
      value={{
        linkedStudents,
        selectedChildId: selectedChild?.id || null,
        selectedChild,
        setSelectedChildId,
        isLoading,
        refetch,
      }}
    >
      {children}
    </ChildSwitcherContext.Provider>
  );
}

export function useChildSwitcher() {
  const context = useContext(ChildSwitcherContext);
  if (!context) {
    return {
      linkedStudents: [],
      selectedChildId: null,
      selectedChild: null,
      setSelectedChildId: () => { },
      isLoading: false,
      refetch: async () => { },
    };
  }
  return context;
}
