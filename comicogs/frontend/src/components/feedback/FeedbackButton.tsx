'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

type FeedbackType = 'bug' | 'feature' | 'general';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<FeedbackType>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          type,
          page: pathname,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setMessage('');
        setTimeout(() => {
          setIsOpen(false);
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg hover:shadow-xl transition-shadow"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alpha Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Comicogs by sharing your thoughts, bugs, or feature requests.
          </DialogDescription>
        </DialogHeader>

        {submitStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thank you! Your feedback has been submitted.
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Failed to submit feedback. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {submitStatus !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={(value: FeedbackType) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Tell us what you think..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/1000
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
