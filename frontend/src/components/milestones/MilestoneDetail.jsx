import { format, formatDistanceToNow } from 'date-fns';
import { Calendar, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusVariantMap = {
  'Not Started': 'outline',
  'In Progress': 'default',
  'Completed': 'success',
  'On Hold': 'warning',
};

export function MilestoneDetail({ milestone, onEdit, onDelete }) {
  if (!milestone) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{milestone.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <Badge variant={statusVariantMap[milestone.status] || 'outline'} className="text-sm">
              {milestone.status}
            </Badge>
            {milestone.dueDate && (
              <div className="flex items-center text-sm">
                <Calendar className="mr-1 h-4 w-4" />
                <span>Due {format(new Date(milestone.dueDate), 'MMM d, yyyy')}</span>
                <span className="mx-2">•</span>
                <Clock className="mr-1 h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(milestone.dueDate), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      {milestone.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line">{milestone.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {milestone.createdAt
                ? format(new Date(milestone.createdAt), 'PPpp')
                : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {milestone.updatedAt
                ? format(new Date(milestone.updatedAt), 'PPpp')
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {milestone.completedAt && milestone.status === 'Completed' && (
        <Card className="border-green-100 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-700">
              {format(new Date(milestone.completedAt), 'PPpp')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
