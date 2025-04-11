
import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useUser } from '@/context/UserContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getStudentIdFromAddress, getInstituteIdFromAddress } from '@/utils/contracts';

export function useNotifications() {
  const { account, isConnected } = useWeb3();
  const { user } = useUser();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  useEffect(() => {
    if (!isConnected || !account) return;
    
    let certificateChannel: any = null;
    let changeRequestChannel: any = null;
    let accessGrantChannel: any = null;
    
    const setupSubscriptions = async () => {
      try {
        // Get the appropriate ID based on user role
        let entityId = null;
        if (user.role === 'institute') {
          entityId = await getInstituteIdFromAddress(account);
        } else if (user.role === 'student') {
          entityId = await getStudentIdFromAddress(account);
        }
        
        if (!entityId) {
          console.error("Could not find user ID for notifications");
          return;
        }
        
        // Subscribe to certificate updates
        certificateChannel = supabase
          .channel('certificates-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'certificates',
              filter: user.role === 'institute' ? `institute_id=eq.${entityId}` : `student_id=eq.${entityId}`
            },
            (payload) => {
              console.log('Certificate update:', payload);
              setHasNewNotifications(true);
              
              // Show appropriate toast notification based on event type
              if (payload.eventType === 'INSERT') {
                toast({
                  title: user.role === 'institute' ? "New Certificate Upload" : "Certificate Added",
                  description: user.role === 'institute' 
                    ? "A new certificate has been uploaded for your review"
                    : "A new certificate has been issued to you",
                });
              } else if (payload.eventType === 'UPDATE' && payload.new?.is_approved) {
                toast({
                  title: "Certificate Approved",
                  description: user.role === 'institute' 
                    ? "You have approved a certificate"
                    : "Your certificate has been approved by the institute",
                });
              }
            }
          )
          .subscribe();
          
        // Subscribe to institute change requests
        if (user.role === 'institute') {
          changeRequestChannel = supabase
            .channel('change-requests')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'institute_change_requests',
                filter: `requested_institute_id=eq.${entityId}`
              },
              (payload) => {
                console.log('Change request update:', payload);
                setHasNewNotifications(true);
                
                if (payload.eventType === 'INSERT') {
                  toast({
                    title: "New Institute Change Request",
                    description: "A student has requested to join your institute",
                  });
                }
              }
            )
            .subscribe();
        }
        
        // Subscribe to access grants (for students)
        if (user.role === 'student') {
          accessGrantChannel = supabase
            .channel('access-grants')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'access_grants',
                filter: `granted_by=eq.${entityId}`
              },
              (payload) => {
                console.log('Access grant update:', payload);
                toast({
                  title: "Access Granted",
                  description: "You've granted access to one of your certificates",
                });
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error("Error setting up real-time notifications:", error);
      }
    };
    
    setupSubscriptions();
    
    // Cleanup function to remove channels
    return () => {
      if (certificateChannel) supabase.removeChannel(certificateChannel);
      if (changeRequestChannel) supabase.removeChannel(changeRequestChannel);
      if (accessGrantChannel) supabase.removeChannel(accessGrantChannel);
    };
  }, [isConnected, account, user.role]);
  
  // Function to clear notification flag
  const clearNotifications = () => {
    setHasNewNotifications(false);
  };
  
  return {
    hasNewNotifications,
    clearNotifications
  };
}
