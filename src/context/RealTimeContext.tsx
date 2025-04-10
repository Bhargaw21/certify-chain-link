
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWeb3 } from './Web3Context';
import { useUser } from './UserContext';
import {
  subscribeToCertificates,
  subscribeToInstituteChangeRequests,
  subscribeToStudentCertificates,
  getStudentIdFromAddress,
  getInstituteIdFromAddress
} from '@/services/supabase';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeContextType {
  certificateUpdates: any[];
  changeRequestUpdates: any[];
  studentCertificateUpdates: any[];
  clearUpdates: () => void;
}

const RealTimeContext = createContext<RealTimeContextType>({
  certificateUpdates: [],
  changeRequestUpdates: [],
  studentCertificateUpdates: [],
  clearUpdates: () => {}
});

export const useRealTime = () => useContext(RealTimeContext);

export const RealTimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, account } = useWeb3();
  const { user } = useUser();
  const [certificateUpdates, setCertificateUpdates] = useState<any[]>([]);
  const [changeRequestUpdates, setChangeRequestUpdates] = useState<any[]>([]);
  const [studentCertificateUpdates, setStudentCertificateUpdates] = useState<any[]>([]);
  const [instituteId, setInstituteId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Get database IDs when user authenticates
  useEffect(() => {
    const fetchIds = async () => {
      if (isConnected && account) {
        try {
          if (user.role === 'institute') {
            const id = await getInstituteIdFromAddress(account);
            setInstituteId(id || null);
          } else if (user.role === 'student') {
            const id = await getStudentIdFromAddress(account);
            setStudentId(id || null);
          }
        } catch (error) {
          console.error("Error fetching IDs:", error);
        }
      }
    };

    fetchIds();
  }, [isConnected, account, user.role]);

  // Set up real-time subscriptions
  useEffect(() => {
    let certificateChannel: any = null;
    let changeRequestChannel: any = null;
    let studentCertificateChannel: any = null;

    const setupSubscriptions = async () => {
      if (instituteId && user.role === 'institute') {
        // Subscribe to certificate updates for institute
        certificateChannel = subscribeToCertificates(instituteId, (payload) => {
          setCertificateUpdates(prev => [...prev, payload]);
        });

        // Subscribe to change requests for institute
        changeRequestChannel = subscribeToInstituteChangeRequests(instituteId, (payload) => {
          setChangeRequestUpdates(prev => [...prev, payload]);
        });
      }

      if (studentId && user.role === 'student') {
        // Subscribe to certificate updates for student
        studentCertificateChannel = subscribeToStudentCertificates(studentId, (payload) => {
          setStudentCertificateUpdates(prev => [...prev, payload]);
        });
      }
    };

    if (isConnected && (instituteId || studentId)) {
      setupSubscriptions();
    }

    // Cleanup
    return () => {
      if (certificateChannel) {
        supabase.removeChannel(certificateChannel);
      }
      if (changeRequestChannel) {
        supabase.removeChannel(changeRequestChannel);
      }
      if (studentCertificateChannel) {
        supabase.removeChannel(studentCertificateChannel);
      }
    };
  }, [isConnected, instituteId, studentId, user.role]);

  const clearUpdates = () => {
    setCertificateUpdates([]);
    setChangeRequestUpdates([]);
    setStudentCertificateUpdates([]);
  };

  return (
    <RealTimeContext.Provider
      value={{
        certificateUpdates,
        changeRequestUpdates,
        studentCertificateUpdates,
        clearUpdates
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};
