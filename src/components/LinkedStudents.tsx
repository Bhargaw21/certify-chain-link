
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useWeb3 } from '@/context/Web3Context';
import { getLinkedStudents } from '@/utils/contracts';
import { Loader2, User } from 'lucide-react';

const LinkedStudents: React.FC = () => {
  const { signer } = useWeb3();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    if (!signer) return;
    
    try {
      setLoading(true);
      const linkedStudents = await getLinkedStudents(signer);
      setStudents(linkedStudents);
    } catch (error) {
      console.error("Error loading linked students:", error);
      toast({
        title: "Failed to load students",
        description: "Could not load your linked students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (signer) {
      loadStudents();
    }
  }, [signer]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Students</CardTitle>
        <CardDescription>
          Students currently linked to your institute
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No students linked to your institute yet
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((student, index) => (
              <div key={index} className="flex items-center p-3 border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{student.name || 'Unnamed Student'}</p>
                  <p className="text-sm text-gray-500 truncate">{student.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedStudents;
