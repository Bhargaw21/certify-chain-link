
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, Upload, Users } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CertificateUpload from '@/components/CertificateUpload';
import PendingCertificates from '@/components/PendingCertificates';
import LinkedStudents from '@/components/LinkedStudents';

const InstituteDashboard = () => {
  const navigate = useNavigate();
  const { account, isConnected, connectWallet, networkName } = useWeb3();
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!account && !isConnected) {
      // Automatically try to connect wallet when page loads
      const attemptConnection = async () => {
        try {
          await connectWallet();
        } catch (error) {
          console.error("Failed to auto-connect wallet:", error);
        }
      };
      
      attemptConnection();
    }
  }, []);

  const handleCertificateUploaded = () => {
    // Force refresh of pending certificates when a new one is uploaded
    setRefreshKey(prev => prev + 1);
    // Switch to the pending tab to show the newly uploaded certificate
    setActiveTab('pending');
  };

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Institute Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage certificates and students</p>
          </div>
          
          {account && (
            <div className="mt-4 md:mt-0">
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                {networkName && <span className="mr-2 text-gray-500">Network: {networkName}</span>}
                <span className="font-medium truncate">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>
              </div>
            </div>
          )}
        </div>

        {!isConnected ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-10">
                <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Wallet not connected</h2>
                <p className="text-gray-500 mb-6 text-center">
                  Please connect your wallet to access your institute dashboard.
                </p>
                <Button onClick={connectWallet}>Connect Wallet</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="upload" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Students
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
              <div className="flex flex-col items-center">
                <CertificateUpload onSuccess={handleCertificateUploaded} />
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-6">
              <PendingCertificates key={refreshKey} />
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <LinkedStudents key={refreshKey} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default InstituteDashboard;
