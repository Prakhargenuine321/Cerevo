import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Rocket } from 'lucide-react';

export default function LoginPrompt() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to GATE Prep Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in to your account to access your personalized study dashboard, track your progress, and prepare for GATE.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full gap-2"
              size="lg"
            >
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Create one
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
