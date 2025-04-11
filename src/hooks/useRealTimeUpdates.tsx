
import { useState, useEffect } from 'react';
import { useRealTime } from '@/context/RealTimeContext';
import { toast } from '@/components/ui/use-toast';

export function useRealTimeUpdates() {
  const { 
    certificateUpdates, 
    changeRequestUpdates, 
    studentCertificateUpdates, 
    clearUpdates 
  } = useRealTime();
  const [needsRefresh, setNeedsRefresh] = useState<boolean>(false);

  // Process certificate updates (for institutes)
  useEffect(() => {
    if (certificateUpdates.length > 0) {
      const latestUpdate = certificateUpdates[certificateUpdates.length - 1];
      
      if (latestUpdate.eventType === 'INSERT') {
        toast({
          title: "New Certificate",
          description: "A new certificate has been uploaded for approval",
        });
      } else if (latestUpdate.eventType === 'UPDATE') {
        toast({
          title: "Certificate Updated",
          description: "A certificate's status has been updated",
        });
      }
      
      setNeedsRefresh(true);
      clearUpdates();
    }
  }, [certificateUpdates, clearUpdates]);

  // Process change request updates (for institutes)
  useEffect(() => {
    if (changeRequestUpdates.length > 0) {
      const latestUpdate = changeRequestUpdates[changeRequestUpdates.length - 1];
      
      if (latestUpdate.eventType === 'INSERT') {
        toast({
          title: "New Institute Change Request",
          description: "A student has requested to change to your institute",
        });
      } else if (latestUpdate.eventType === 'UPDATE') {
        toast({
          title: "Change Request Updated",
          description: "A change request's status has been updated",
        });
      }
      
      setNeedsRefresh(true);
      clearUpdates();
    }
  }, [changeRequestUpdates, clearUpdates]);

  // Process student certificate updates (for students)
  useEffect(() => {
    if (studentCertificateUpdates.length > 0) {
      const latestUpdate = studentCertificateUpdates[studentCertificateUpdates.length - 1];
      
      if (latestUpdate.eventType === 'UPDATE') {
        const newRecord = latestUpdate.new;
        
        if (newRecord.is_approved) {
          toast({
            title: "Certificate Approved",
            description: "Your certificate has been approved by the institute",
          });
        }
      } else if (latestUpdate.eventType === 'INSERT') {
        toast({
          title: "Certificate Added",
          description: "A new certificate has been added to your profile",
        });
      }
      
      setNeedsRefresh(true);
      clearUpdates();
    }
  }, [studentCertificateUpdates, clearUpdates]);

  // Add a function to manually trigger refresh
  const triggerRefresh = () => {
    setNeedsRefresh(true);
  };

  return {
    needsRefresh,
    resetRefreshFlag: () => setNeedsRefresh(false),
    triggerRefresh
  };
}
