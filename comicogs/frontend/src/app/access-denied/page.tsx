'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Mail, Home } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Access Restricted</CardTitle>
          <CardDescription>
            This is a closed alpha version of Comicogs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>
              You need an invite to access the alpha version. 
              Your email address is not currently on the allowlist.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button asChild className="w-full" variant="outline">
              <Link href="mailto:alpha@comicogs.com?subject=Alpha Access Request">
                <Mail className="w-4 h-4 mr-2" />
                Request Alpha Access
              </Link>
            </Button>
            
            <Button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full" 
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            <p>
              Want to learn more about Comicogs?{' '}
              <Link href="https://comicogs.com" className="text-primary hover:underline">
                Visit our main site
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
