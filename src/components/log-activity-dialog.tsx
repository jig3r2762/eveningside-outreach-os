'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CHANNELS, ACTIVITY_TYPES, getStatusColor } from '@/lib/utils';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LogActivityDialogProps {
  leadId: string;
  companyId: string;
  contacts: { id: string; fullName: string }[];
  trigger?: React.ReactNode;
}

export function LogActivityDialog({ leadId, companyId, contacts, trigger }: LogActivityDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [channel, setChannel] = React.useState('EMAIL');
  const [activityType, setActivityType] = React.useState('EMAIL_SENT');
  const [direction, setDirection] = React.useState('OUTBOUND');
  const [contactId, setContactId] = React.useState(contacts.length > 0 ? contacts[0].id : '');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          companyId,
          contactId,
          channel,
          activityType,
          direction,
          subject,
          message,
          outcome,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
          notes
        }),
      });
      if (!res.ok) throw new Error('Failed to log activity');
      setOpen(false);
      router.refresh();
      
      // Reset form
      setSubject('');
      setMessage('');
      setOutcome('');
      setNextFollowUpDate('');
      setNotes('');
    } catch (error) {
      console.error(error);
      alert('Error logging activity');
    } finally {
      setLoading(false);
    }
  };

  const isLinkedIn = channel === 'LINKEDIN';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Log Activity
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTBOUND">Outbound</SelectItem>
                  <SelectItem value="INBOUND">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLinkedIn && (
            <div className="p-3 bg-slate-50 border rounded-md space-y-2">
              <Label className="text-xs uppercase text-slate-500 font-semibold">LinkedIn Quick Status Update</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-slate-200" onClick={() => {setActivityType('CONNECTION_REQUEST'); setSubject('Sent Connection Request');}}>Request Sent</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-slate-200" onClick={() => {setActivityType('CONNECTION_ACCEPTED'); setSubject('Connection Accepted');}}>Accepted</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-slate-200" onClick={() => {setActivityType('FIRST_MESSAGE'); setSubject('Sent Message');}}>Message Sent</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-slate-200" onClick={() => {setActivityType('OTHER'); setDirection('INBOUND'); setSubject('Received Reply');}}>Replied</Badge>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Subject (Optional)</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="E.g., Intro email" />
          </div>

          <div className="space-y-2">
            <Label>Message / Content</Label>
            <Textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="What was said?"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="E.g., Left voicemail" />
            </div>
            <div className="space-y-2">
              <Label>Next Follow-up Date</Label>
              <Input type="date" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">Sets a follow-up reminder</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Any additional internal context?"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
