'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { parentPortalService } from '../services/parent-portal-service';
import type { LinkedStudent } from '../types/parent-portal';

import { useAuth } from '@/providers/auth-provider';

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
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    if (!isAuthenticated || user?.roleCode !== 'PARENT') {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await parentPortalService.getLinkedStudents();
      setLinkedStudents(data);
      const savedChildId =
        typeof window !== 'undefined'
          ? localStorage.getItem('parent_portal_selected_child_id')
          : null;
      if (savedChildId && data.some((s) => s.id === savedChildId)) {
        setSelectedChildIdState(savedChildId);
      } else if (data.length > 0) {
        setSelectedChildIdState(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load linked students:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const setSelectedChildId = useCallback((id: string) => {
    setSelectedChildIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parent_portal_selected_child_id', id);
    }
  }, []);

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
        refetch: fetchStudents,
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
      setSelectedChildId: () => {},
      isLoading: false,
      refetch: async () => {},
    };
  }
  return context;
}
