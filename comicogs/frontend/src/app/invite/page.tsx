'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, ArrowRight } from 'lucide-react';
import { validateAlphaInviteCode, getAlphaInviteCode } from '@/lib/release';

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // If no invite code is required, redirect to login
  const requiredCode = getAlphaInviteCode();
  if (!requiredCode) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      setIsValidating(false);
      return;
    }

    if (validateAlphaInviteCode(inviteCode)) {
      // Store valid invite code in session storage
      sessionStorage.setItem('alpha_invite_verified', 'true');
      
      // Redirect to login or signup
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('callbackUrl', callbackUrl);
      loginUrl.searchParams.set('invited', 'true');
      
      router.push(loginUrl.toString());
    } else {
      setError('Invalid invite code. Please check and try again.');
    }

    setIsValidating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Welcome to Comicogs Alpha</CardTitle>
          <CardDescription>
            Enter your invite code to access the closed alpha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="text-center text-lg tracking-wider"
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isValidating}
            >
              {isValidating ? (
                'Validating...'
              ) : (
                <>
                  Continue to Alpha
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Don't have an invite code?{' '}
              <a 
                href="mailto:alpha@comicogs.com?subject=Alpha Invite Request" 
                className="text-primary hover:underline"
              >
                Request one
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
