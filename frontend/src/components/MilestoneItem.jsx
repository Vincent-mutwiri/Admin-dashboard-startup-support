import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MessageSquare, Check } from 'lucide-react';

const statusVariantMap = {
  'Not Started': 'outline',
  'In Progress': 'default',
  'Completed': 'success',
  'On Hold': 'warning',
};

export function MilestoneItem({ milestone, onAddDeliverable, onAddComment }) {
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [deliverable, setDeliverable] = useState('');
  const [comment, setComment] = useState('');

  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    if (!deliverable.trim()) return;
    
    try {
      await onAddDeliverable({
        title: deliverable,
        description: '',
        milestone: milestone._id,
        isCompleted: false
      });
      setDeliverable('');
      setShowAddDeliverable(false);
    } catch (error) {
      console.error('Error adding deliverable:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      // Create a clean data object with only the necessary fields
      const commentData = {
        milestoneId: milestone._id,
        text: comment.trim()
      };
      
      await onAddComment(commentData);
      setComment('');
      setShowAddComment(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      // The error will be handled by the parent component
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{milestone.title}</CardTitle>
            <CardDescription className="mt-1">
              Due: {milestone.dueDate ? format(new Date(milestone.dueDate), 'MMM d, yyyy') : 'No due date'}
            </CardDescription>
          </div>
          <Badge variant={statusVariantMap[milestone.status] || 'outline'}>
            {milestone.status}
          </Badge>
        </div>
      </CardHeader>
      
      {milestone.description && (
        <CardContent>
          <p className="text-muted-foreground">{milestone.description}</p>
        </CardContent>
      )}

      <CardFooter className="flex flex-col items-start gap-4">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Deliverables</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm gap-1"
              onClick={() => setShowAddDeliverable(!showAddDeliverable)}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          
          {showAddDeliverable && (
            <form onSubmit={handleAddDeliverable} className="flex gap-2 mb-3">
              <Input
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                placeholder="Enter deliverable"
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="sm">
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </form>
          )}
          
          {milestone.deliverables?.length > 0 ? (
            <ul className="space-y-2">
              {milestone.deliverables.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={item.isCompleted} 
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className={item.isCompleted ? 'line-through text-muted-foreground' : ''}>
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No deliverables yet</p>
          )}
        </div>

        <div className="w-full pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Comments</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm gap-1"
              onClick={() => setShowAddComment(!showAddComment)}
            >
              <MessageSquare className="h-4 w-4" />
              Add Comment
            </Button>
          </div>
          
          {showAddComment && (
            <form onSubmit={handleAddComment} className="mb-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="mb-2"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddComment(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Post Comment
                </Button>
              </div>
            </form>
          )}
          
          {milestone.comments?.length > 0 ? (
            <div className="space-y-3">
              {milestone.comments.map((comment, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{comment.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.author?.name || 'Anonymous'} • {format(new Date(comment.createdAt || new Date()), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default MilestoneItem;
