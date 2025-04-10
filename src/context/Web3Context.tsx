
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  isConnected: false,
  provider: null,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Check if MetaMask is installed
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      
      if (!ethereum) {
        console.log("Make sure you have MetaMask installed!");
        return;
      }
      
      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });
      
      if (accounts.length !== 0) {
        const currentAccount = accounts[0];
        console.log("Found an authorized account:", currentAccount);
        setAccount(currentAccount);
        setIsConnected(true);
        
        // Setup provider and signer
        const web3Provider = new ethers.providers.Web3Provider(ethereum);
        setProvider(web3Provider);
        setSigner(web3Provider.getSigner());
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      
      if (!ethereum) {
        alert("Please install MetaMask to use this feature!");
        return;
      }
      
      // Request account access
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      console.log("Connected to account:", accounts[0]);
      setAccount(accounts[0]);
      setIsConnected(true);
      
      // Setup provider and signer
      const web3Provider = new ethers.providers.Web3Provider(ethereum);
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
  };

  // Listen for changes to wallet accounts
  useEffect(() => {
    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const { ethereum } = window as any;
        if (ethereum) {
          const web3Provider = new ethers.providers.Web3Provider(ethereum);
          setProvider(web3Provider);
          setSigner(web3Provider.getSigner());
        }
      } else {
        setAccount(null);
        setIsConnected(false);
        setProvider(null);
        setSigner(null);
      }
    };
    
    const { ethereum } = window as any;
    if (ethereum) {
      ethereum.on('accountsChanged', onAccountsChanged);
    }
    
    // Check if already connected
    checkIfWalletIsConnected();
    
    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', onAccountsChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{
      account,
      isConnected,
      provider,
      signer,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </Web3Context.Provider>
  );
};
