// src/hooks/useUserStatusMonitor.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to monitor current user's status and automatically log them out if deactivated
 * This runs on the client side to provide immediate feedback
 */
export function useUserStatusMonitor() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let statusCheckInterval: NodeJS.Timeout;

    const checkUserStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Check user status in the database
        const { data: userData, error } = await supabase
          .from('users')
          .select('status')
          .eq('id', user.id)
          .single();

        // If user not found or is inactive, log them out
        if (error || !userData || userData.status === 'Inactive') {
          await supabase.auth.signOut();
          toast.error('Your account has been deactivated. Please contact an administrator.');
          router.push('/login?message=account_deactivated');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    // Check status immediately on mount
    checkUserStatus();

    // Check status every 30 seconds
    statusCheckInterval = setInterval(checkUserStatus, 30000);

    // Set up real-time subscription to users table changes
    const userStatusChannel = supabase
      .channel('user-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        async (payload) => {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) return;

          // Check if the update is for the current user
          if (payload.new.id === user.id && payload.new.status === 'Inactive') {
            await supabase.auth.signOut();
            toast.error('Your account has been deactivated. Please contact an administrator.');
            router.push('/login?message=account_deactivated');
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      clearInterval(statusCheckInterval);
      supabase.removeChannel(userStatusChannel);
    };
  }, [router, supabase]);
}