'use client';

import {
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_COLORS,
  StudentStatus,
} from '@/features/students/types/student';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  User,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface StudentCardProps {
  student: any;
  onEdit?: (student: any) => void;
  onView?: (student: any) => void;
  onDelete?: (student: any) => void;
  onStatusChange?: (student: any, status: StudentStatus) => void;
  onPrefetch?: (id: string) => void;
  selected?: boolean;
  onSelect?: (student: any, selected: boolean) => void;
}

export function StudentCard({
  student,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  onPrefetch,
  selected,
  onSelect,
}: StudentCardProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const statusLabel = STUDENT_STATUS_LABELS[student.status as StudentStatus];
  const statusColor = STUDENT_STATUS_COLORS[student.status as StudentStatus];
  const fullName =
    student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card
      className={`w-full rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs space-y-3 transition-all hover:border-violet-300 ${
        selected ? 'ring-2 ring-violet-500' : ''
      }`}
      onMouseEnter={() => onPrefetch?.(student.id)}
      onFocus={() => onPrefetch?.(student.id)}
      tabIndex={0}
    >
      <CardContent className="p-0 space-y-3">
        {/* Header: Student ID Badge & Interactive Status Switch */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 font-mono font-bold text-xs border border-violet-100">
            {student.studentId || 'STD-REG'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={updatingStatus}
              onClick={() => {
                setUpdatingStatus(true);
                const newStatus = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                onStatusChange?.(student, newStatus);
                setTimeout(() => setUpdatingStatus(false), 500);
              }}
              title={student.status === 'ACTIVE' ? 'Click to deactivate' : 'Click to activate'}
              className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                student.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  student.status === 'ACTIVE' ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                student.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {student.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Student Profile Info */}
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 rounded-xl shrink-0 border border-violet-100">
            <AvatarImage src={student.profileImage} alt={fullName} />
            <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
              {fullName}
            </h4>
            <div className="text-xs text-slate-500 space-y-0.5 mt-0.5">
              {student.email && (
                <p className="flex items-center gap-1 font-medium truncate">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{student.email}</span>
                </p>
              )}
              {student.phone && (
                <p className="flex items-center gap-1 text-slate-500">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{student.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Course & Batch Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
          {student.courseName && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-semibold truncate max-w-[170px]">
              <GraduationCap className="w-3 h-3 text-sky-500 shrink-0" />
              {student.courseName}
            </span>
          )}
          {student.batchName && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold truncate max-w-[170px]">
              <User className="w-3 h-3 text-purple-500 shrink-0" />
              {student.batchName}
            </span>
          )}
        </div>

        {/* Mobile Action Buttons Bar */}
        <div className="flex items-center justify-between pt-2 gap-2 border-t border-slate-100">
          <button
            onClick={() => onView?.(student)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs border border-violet-100 hover:bg-violet-100 transition"
          >
            <User className="w-3.5 h-3.5 text-violet-600" /> View & Edit Details
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete?.(student)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-100 hover:bg-rose-100 transition flex items-center gap-1 shrink-0"
            >
              Delete
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
