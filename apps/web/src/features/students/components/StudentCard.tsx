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
      className={`w-full transition-all duration-200 ${selected ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''}`}
      onMouseEnter={() => onPrefetch?.(student.id)}
      onFocus={() => onPrefetch?.(student.id)}
      tabIndex={0}
    >
      <CardContent className="p-4">
        {/* Header with avatar, name, student ID, and status */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.profileImage} alt={fullName} />
              <AvatarFallback className="text-lg font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            {selected && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {student.studentId}
                </p>
              </div>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => {
                  setUpdatingStatus(true);
                  const newStatus = student.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                  onStatusChange?.(student, newStatus);
                  setTimeout(() => setUpdatingStatus(false), 500);
                }}
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  student.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'
                }`}
                title={student.status === 'ACTIVE' ? 'Deactivate student' : 'Activate student'}
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                    student.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                >
                  {updatingStatus ? (
                    <svg
                      className="h-3 w-3 animate-spin text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                      />
                    </svg>
                  ) : student.status === 'ACTIVE' ? (
                    <ToggleRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-3 w-3 text-gray-400" />
                  )}
                </span>
              </button>
            </div>

            {/* Contact info */}
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{student.phone}</span>
              </div>
            </div>

            {/* Batch and Course */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{student.batchName}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{student.courseName}</span>
              </div>
            </div>

            {/* Admission date */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Admitted: {formatDate(student.admissionDate)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              onClick={() => onView?.(student)}
            >
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              onClick={() => onEdit?.(student)}
            >
              Edit
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView?.(student)}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(student)}>Edit Student</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onStatusChange?.(student, 'ACTIVE')}
                className={student.status === 'ACTIVE' ? 'text-green-600' : ''}
              >
                Mark Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange?.(student, 'SUSPENDED')}
                className={student.status === 'SUSPENDED' ? 'text-gray-600' : ''}
              >
                Mark Inactive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange?.(student, 'SUSPENDED')}
                className={student.status === 'SUSPENDED' ? 'text-red-600' : ''}
              >
                Suspend
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete?.(student)} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
