
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, Upload, Users, Clock, Bell, Copy } from 'lucide-react';
import { useWeb3 } from '@/context/Web3Context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CertificateUpload from '@/components/CertificateUpload';
import { useNotifications } from '@/hooks/useNotifications';
import CertificateList from '@/components/CertificateList';
import StudentList from '@/components/StudentList';
import ChangeRequestList from '@/components/ChangeRequestList';
import { toast } from '@/components/ui/use-toast';

const InstituteDashboard = () => {
  const navigate = useNavigate();
  const { account, isConnected, connectWallet, networkName } = useWeb3();
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshKey, setRefreshKey] = useState(0);
  const { hasNewNotifications, clearNotifications } = useNotifications();

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

  const handleRefresh = () => {
    // Force refresh of all components
    setRefreshKey(prev => prev + 1);
    clearNotifications();
  };

  const handleCertificateUploaded = () => {
    // Force refresh and switch to the pending tab
    handleRefresh();
    setActiveTab('pending');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Clear notifications when switching tabs
    clearNotifications();
  };
  
  const copyAddressToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({
        title: "Address copied",
        description: "Institute address copied to clipboard",
      });
    }
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
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              {hasNewNotifications && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-yellow-500" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform -translate-y-1/2 translate-x-1/2"></span>
                </div>
              )}
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                {networkName && <span className="mr-2 text-gray-500">Network: {networkName}</span>}
                <span className="font-medium truncate">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                Refresh
              </Button>
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
          <>
            {/* Institute Address Card */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Your Institute Address</h2>
                    <p className="text-sm text-gray-500 mb-2">
                      Share this address with students to connect to your institute
                    </p>
                    <div className="p-3 bg-gray-50 rounded-md flex items-center justify-between">
                      <code className="text-sm md:text-base break-all">{account}</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={copyAddressToClipboard} 
                        className="ml-2 flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid grid-cols-4 max-w-md mx-auto">
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
                <TabsTrigger value="requests" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Requests
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-6">
                <div className="flex flex-col items-center">
                  <CertificateUpload onSuccess={handleCertificateUploaded} />
                </div>
              </TabsContent>

              <TabsContent value="pending" className="space-y-6">
                <CertificateList 
                  key={`pending-${refreshKey}`} 
                  mode="institute" 
                  showPending={true} 
                  onRefresh={handleRefresh} 
                />
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <StudentList key={`students-${refreshKey}`} onRefresh={handleRefresh} />
              </TabsContent>
              
              <TabsContent value="requests" className="space-y-6">
                <ChangeRequestList key={`requests-${refreshKey}`} onRefresh={handleRefresh} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default InstituteDashboard;
