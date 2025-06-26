import { useQuery } from '@tanstack/react-query';
import { getMeetingsByDepartment } from '@/services/meetingService';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Video, Users, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';

const statusVariantMap = {
  scheduled: 'outline',
  in_progress: 'default',
  completed: 'success',
  canceled: 'destructive',
};

const meetingTypeIcons = {
  in_person: Users,
  virtual: Video,
  hybrid: Video,
};

export default function DepartmentMeetings({ departmentId }) {
  const { data: meetings, isLoading, isError, error } = useQuery({
    queryKey: ['meetings', departmentId],
    queryFn: () => getMeetingsByDepartment(departmentId).then(res => res.data),
    enabled: !!departmentId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          {error.response?.data?.message || 'Failed to load meetings'}
        </p>
      </div>
    );
  }

  // Empty state
  if (!meetings || meetings.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No meetings scheduled</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Schedule a meeting to get started.
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>
    );
  }

  // Group meetings by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.meetingDate) >= today
  ).sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
  
  const pastMeetings = meetings.filter(meeting => 
    new Date(meeting.meetingDate) < today
  ).sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meetings</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {upcomingMeetings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">UPCOMING</h3>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {pastMeetings.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-sm font-medium text-muted-foreground">PAST MEETINGS</h3>
          <div className="space-y-3">
            {pastMeetings.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} isPast />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, isPast = false }) {
  const Icon = meetingTypeIcons[meeting.meetingType] || Calendar;
  
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{meeting.title}</h4>
            <Badge variant={statusVariantMap[meeting.status] || 'outline'} className="text-xs">
              {meeting.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1.5" />
            {format(new Date(meeting.meetingDate), 'EEEE, MMM d, yyyy')}
            <span className="mx-2">•</span>
            <Clock className="h-4 w-4 mr-1.5" />
            {format(new Date(meeting.meetingDate), 'h:mm a')}
            {meeting.duration && ` (${meeting.duration} min)`}
          </div>
          
          {meeting.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon className="h-4 w-4 mr-1.5" />
              {meeting.location}
            </div>
          )}
        </div>
        
        <Button variant="ghost" size="sm">
          {isPast ? 'View Notes' : 'Join'}
        </Button>
      </div>
    </div>
  );
}
