import React, { useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Button,
  Image,
  Alert,
  Share,
  Modal,
} from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import logo from './logo.png';
/// <reference types="./png.d.ts" />

// TypeScript module declarations for missing types
// @ts-ignore
declare module 'react-native-get-sms-android';
// @ts-ignore
declare module 'react-native-vector-icons/MaterialCommunityIcons';
// @ts-ignore
declare module '*.png';

interface Transaction {
  amount: string;
  date: string;
  vpa: string;
  ref: string;
}

interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

export default function App() {
  const [balance, setBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Manual' | 'Bank'>('All');
  const [sendStatus, setSendStatus] = useState('');
  
  // New state for API key management
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [showApiDetails, setShowApiDetails] = useState(false);
  const [serverUrl, setServerUrl] = useState('https://sms-parsing-906i.onrender.com');

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission Required',
            message: 'This app needs access to SMS to fetch bank transactions.',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          readBankSMS();
        } else {
          setPermissionDenied(true);
          setLoading(false);
        }
      }
    })();
    
    // Load existing API keys from storage
    loadApiKeys();
  }, []);

  // Generate a secure API key
  const generateApiKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Create a new API key
  const createApiKey = async () => {
    if (!newApiKeyName.trim()) {
      Alert.alert('Error', 'Please enter a name for the API key');
      return;
    }

    try {
      // Generate API key through the server
      const response = await fetch(`${serverUrl}/generate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newApiKeyName.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }

      const result = await response.json();
      
      const newKey: ApiKey = {
        id: Date.now().toString(),
        key: result.apiKey,
        name: newApiKeyName.trim(),
        createdAt: result.keyInfo.createdAt,
        isActive: true,
      };

      const updatedKeys = [...apiKeys, newKey];
      setApiKeys(updatedKeys);
      saveApiKeys(updatedKeys);
      setNewApiKeyName('');
      setShowApiKeyModal(false);
      
      // Show the newly created key
      setSelectedApiKey(newKey);
      setShowApiDetails(true);
      
      Alert.alert('Success', 'API key generated successfully!');
    } catch (error: any) {
      Alert.alert('Error', `Failed to generate API key: ${error.message}`);
    }
  };

  // Delete an API key
  const deleteApiKey = (keyId: string) => {
    Alert.alert(
      'Delete API Key',
      'Are you sure you want to delete this API key? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedKeys = apiKeys.filter(key => key.id !== keyId);
            setApiKeys(updatedKeys);
            saveApiKeys(updatedKeys);
          },
        },
      ]
    );
  };

  // Save API keys to storage (simplified - in production use AsyncStorage)
  const saveApiKeys = (keys: ApiKey[]) => {
    // In a real app, use AsyncStorage or secure storage
    console.log('Saving API keys:', keys);
  };

  // Load API keys from storage
  const loadApiKeys = () => {
    // In a real app, load from AsyncStorage or secure storage
    // For now, we'll start with an empty array
    setApiKeys([]);
  };

  // Share API details
  const shareApiDetails = async (apiKey: ApiKey) => {
    const apiDetails = `API Key: ${apiKey.key}\nAPI URL: ${serverUrl}/transactions\n\nUse this key to access your bank transactions in JSON format.`;
    
    try {
      await Share.share({
        message: apiDetails,
        title: 'Bank Transaction API Details',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Get structured JSON data for API
  const getStructuredData = () => {
    return {
      user: {
        balance: balance,
        totalTransactions: transactions.length,
        lastUpdated: new Date().toISOString(),
      },
      transactions: transactions.map((tx, index) => {
        // Safely parse amount, handle potential errors
        let parsedAmount;
        try {
          parsedAmount = parseFloat(tx.amount.replace(/,/g, ''));
          if (isNaN(parsedAmount)) {
            console.warn(`Invalid amount format: ${tx.amount}`);
            parsedAmount = 0;
          }
        } catch (error) {
          console.error(`Error parsing amount ${tx.amount}:`, error);
          parsedAmount = 0;
        }
        
        return {
          id: index + 1,
          amount: parsedAmount,
          currency: 'INR',
          date: tx.date,
          vpa: tx.vpa,
          reference: tx.ref,
          type: 'debit',
          category: 'bank_transfer',
          status: 'completed',
        };
      }),
      metadata: {
        source: 'SMS_BANK_READER',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
      },
    };
  };

  const readBankSMS = () => {
    const filter = {
      box: 'inbox',
      minDate: Date.now() - 30 * 24 * 60 * 10 * 1000,
      //bodyRegex: '.', // fetch all to inspect
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: any) => {
        console.error('SMS read failed:', fail);
        setError('Unable to read SMS');
        setLoading(false);
      },
      (count: any, smsList: any) => {
        try {
          const messages = JSON.parse(smsList);
          console.log('🔍 Total SMS found:', messages.length);

          const txs: Transaction[] = [];
          let latestBalance: string | null = null;

          messages.forEach((msg: any, index: number) => {
            const body = msg.body || '';
            console.log(`\n[SMS ${index}] body:\n${body}`);

            const amountMatch = body.match(/debited for Rs\.?\s?([\d.,]+)/i);
            const dateMatch = body.match(/on\s(\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2})/i);
            const vpaMatch = body.match(/credited to vpa\s([\w@.]+)/i);
            const refMatch = body.match(/UPI Ref no\s?(\d{9,})/i);
            const balanceMatch = body.match(/Current Balance is INR\s?([\d.,]+)/i);

            console.log('Parsed:', {
              amount: amountMatch?.[1],
              date: dateMatch?.[1],
              vpa: vpaMatch?.[1],
              ref: refMatch?.[1],
              balance: balanceMatch?.[1],
            });

            if (balanceMatch && !latestBalance) latestBalance = balanceMatch[1];
            if (amountMatch && dateMatch && vpaMatch) {
              txs.push({
                amount: amountMatch[1],
                date: dateMatch[1],
                vpa: vpaMatch[1],
                ref: refMatch ? refMatch[1] : 'N/A',
              });
            }
          });

          console.log('✅ Parsed transactions:', txs);
          setBalance(latestBalance);
          setTransactions(txs);
          setLoading(false);
        } catch (err: any) {
          console.error('Parsing exception:', err);
          setError('Error parsing SMS content');
          setLoading(false);
        }
      }
    );
  };

  // Calculate dummy progress for the progress bar (replace with real logic if needed)
  const totalFunds = 50000;
  const remainingFunds = balance ? parseInt(balance.replace(/,/g, '')) : 0;
  const percentLeft = totalFunds ? Math.round((remainingFunds / totalFunds) * 100) : 0;

  // Filtered transactions (for demo, all are 'Manual')
  const filteredTxs = transactions.filter(tx => {
    if (filter === 'All') return true;
    if (filter === 'Manual') return true; // Replace with real filter logic if needed
    if (filter === 'Bank') return false; // Replace with real filter logic if needed
    return true;
  });

  const sendDataToAPI = async () => {
    if (!selectedApiKey) {
      setSendStatus('Please select an API key first.');
      return;
    }
    
    if (transactions.length === 0) {
      setSendStatus('No transactions to send.');
      return;
    }

    try {
      const structuredData = getStructuredData();
      console.log('📤 Sending structured data:', JSON.stringify(structuredData, null, 2));
      
      const requestBody = {
        transactions: structuredData.transactions
      };
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${serverUrl}/store-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': selectedApiKey.key,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Failed to send data');
      }
      
      const result = await response.json();
      console.log('✅ Success response:', result);
      setSendStatus(`Data sent successfully! ${result.storedCount} transactions stored.`);
      
      // Update the API key's last used timestamp
      const updatedKeys = apiKeys.map(key => 
        key.id === selectedApiKey.id 
          ? { ...key, lastUsed: new Date().toISOString() }
          : key
      );
      setApiKeys(updatedKeys);
      saveApiKeys(updatedKeys);
      
    } catch (error: any) {
      console.error('❌ Error in sendDataToAPI:', error);
      setSendStatus('Error sending data: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, backgroundColor: '#101223' }}>
      <View style={{ alignItems: 'center', marginTop: 30 }}>
        <Image source={logo} style={styles.logo} />
      </View>
      <View style={styles.headerRow}>
        <Icon name="lock" size={24} color="#FFD600" style={{ marginRight: 8 }} />
        <Text style={styles.header}>Financial Vault</Text>
        <View style={{ flex: 1 }} />
        <Icon name="menu" size={28} color="#fff" />
      </View>
      
      {/* API Key Management Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="key" size={20} color="#FFD600" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>API Access</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => setShowApiKeyModal(true)}
          >
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.generateButtonText}>Generate API Key</Text>
          </TouchableOpacity>
        </View>
        
        {apiKeys.length === 0 ? (
          <View style={styles.emptyApiKeys}>
            <Icon name="key-outline" size={48} color="#666" />
            <Text style={styles.emptyApiKeysText}>No API keys generated yet</Text>
            <Text style={styles.emptyApiKeysSubtext}>Generate an API key to access your transactions programmatically</Text>
          </View>
        ) : (
          <View style={styles.apiKeysList}>
            {apiKeys.map((key) => (
              <View key={key.id} style={styles.apiKeyCard}>
                <View style={styles.apiKeyInfo}>
                  <Text style={styles.apiKeyName}>{key.name}</Text>
                  <Text style={styles.apiKeyDate}>Created: {new Date(key.createdAt).toLocaleDateString()}</Text>
                  <Text style={styles.apiKeyStatus}>
                    <Icon name={key.isActive ? "check-circle" : "close-circle"} size={14} color={key.isActive ? "#4CAF50" : "#F44336"} />
                    {key.isActive ? " Active" : " Inactive"}
                  </Text>
                </View>
                <View style={styles.apiKeyActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedApiKey(key);
                      setShowApiDetails(true);
                    }}
                  >
                    <Icon name="eye" size={16} color="#FFD600" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteApiKey(key.id)}
                  >
                    <Icon name="delete" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Activity</Text>
      <View style={styles.fundsCard}>
        <Text style={styles.fundsLabel}>Remaining Funds</Text>
        <Text style={styles.fundsValue}>₹{remainingFunds || '0'}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBar, { width: `${percentLeft}%` }]} />
        </View>
        <Text style={styles.percentLeft}>{percentLeft}% left</Text>
      </View>
      <View style={styles.filterRow}>
        {['All', 'Manual', 'Bank'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab as any)}
            disabled={tab !== 'All'} // Only 'All' is enabled for now
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FFD600" />
          <Text style={styles.loadingText}>Reading SMS…</Text>
        </View>
      ) : permissionDenied ? (
        <Text style={styles.errorText}>SMS permission was denied.</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={{ marginTop: 10 }}>
          {filteredTxs.length === 0 ? (
            <Text style={styles.empty}>No transactions found.</Text>
          ) : (
            filteredTxs.map((tx, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardIconCol}>
                  <Icon name="wallet" size={28} color="#6C63FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{i === 0 ? 'Savings' : i === 1 ? 'Wants' : 'Needs'} <Text style={styles.manualTag}>Manual</Text></Text>
                  <Text style={styles.cardSubtitle}>{i === 0 ? 'Emergency' : i === 1 ? 'Groceries' : 'EMI'}</Text>
                  <Text style={styles.cardDate}>01 Jan 1970</Text>
                </View>
                <Text style={styles.cardAmount}>₹{tx.amount}</Text>
              </View>
            ))
          )}
        </View>
      )}
      <View style={{ margin: 16, backgroundColor: '#1A1C2A', borderRadius: 12, padding: 16 }}>
        <Text style={{ color: '#FFD600', fontWeight: 'bold', marginBottom: 8 }}>Debug: Parsed Transactions</Text>
        <Text style={{ color: '#fff', fontSize: 12, marginBottom: 4 }}>
          Total Transactions Found: {transactions.length}
        </Text>
        {transactions.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            {transactions.slice(0, 3).map((tx, index) => (
              <View key={index} style={{ backgroundColor: '#23254A', padding: 8, borderRadius: 6, marginBottom: 4 }}>
                <Text style={{ color: '#4CAF50', fontSize: 10 }}>Transaction {index + 1}:</Text>
                <Text style={{ color: '#fff', fontSize: 10 }}>Amount: ₹{tx.amount}</Text>
                <Text style={{ color: '#fff', fontSize: 10 }}>Date: {tx.date}</Text>
                <Text style={{ color: '#fff', fontSize: 10 }}>VPA: {tx.vpa}</Text>
                <Text style={{ color: '#fff', fontSize: 10 }}>Ref: {tx.ref}</Text>
              </View>
            ))}
            {transactions.length > 3 && (
              <Text style={{ color: '#888', fontSize: 10, textAlign: 'center' }}>
                ... and {transactions.length - 3} more transactions
              </Text>
            )}
          </View>
        ) : (
          <Text style={{ color: '#888', fontSize: 12, textAlign: 'center' }}>
            No transactions parsed yet. Make sure you have bank SMS messages.
          </Text>
        )}
      </View>
      <View style={{ margin: 16, backgroundColor: '#181A2A', borderRadius: 12, padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Send Transactions to API</Text>
        {selectedApiKey ? (
          <>
            <View style={{ backgroundColor: '#23254A', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ color: '#FFD600', fontSize: 12, marginBottom: 4 }}>Selected API Key:</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>{selectedApiKey.name}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{selectedApiKey.key.substring(0, 16)}...</Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: '#2E4BFF',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 8
              }}
              onPress={sendDataToAPI}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Send {transactions.length} Transactions
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ backgroundColor: '#23254A', padding: 16, borderRadius: 8, alignItems: 'center' }}>
            <Icon name="key-outline" size={32} color="#666" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#888', textAlign: 'center' }}>
              Select an API key above to send your transactions
            </Text>
          </View>
        )}
        {!!sendStatus && (
          <View style={{ 
            backgroundColor: sendStatus.includes('Error') ? '#4A1C1C' : '#1C4A1C', 
            padding: 8, 
            borderRadius: 6, 
            marginTop: 8 
          }}>
            <Text style={{ color: sendStatus.includes('Error') ? '#FF6B6B' : '#4CAF50', fontSize: 12 }}>
              {sendStatus}
            </Text>
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />

      {/* Generate API Key Modal */}
      <Modal
        visible={showApiKeyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate New API Key</Text>
              <TouchableOpacity onPress={() => setShowApiKeyModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Create a new API key to access your bank transactions programmatically
            </Text>
            <TextInput
              placeholder="Enter API key name (e.g., 'My App', 'Web Dashboard')"
              placeholderTextColor="#888"
              value={newApiKeyName}
              onChangeText={setNewApiKeyName}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowApiKeyModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={createApiKey}
              >
                <Text style={styles.modalButtonTextPrimary}>Generate Key</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* API Key Details Modal */}
      <Modal
        visible={showApiDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApiDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>API Key Details</Text>
              <TouchableOpacity onPress={() => setShowApiDetails(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {selectedApiKey && (
              <>
                <View style={styles.apiKeyDetailSection}>
                  <Text style={styles.apiKeyDetailLabel}>API Key Name:</Text>
                  <Text style={styles.apiKeyDetailValue}>{selectedApiKey.name}</Text>
                </View>
                <View style={styles.apiKeyDetailSection}>
                  <Text style={styles.apiKeyDetailLabel}>API Key:</Text>
                  <Text style={styles.apiKeyDetailValue}>{selectedApiKey.key}</Text>
                </View>
                <View style={styles.apiKeyDetailSection}>
                  <Text style={styles.apiKeyDetailLabel}>API URL:</Text>
                  <Text style={styles.apiKeyDetailValue}>{serverUrl}/transactions</Text>
                </View>
                <View style={styles.apiKeyDetailSection}>
                  <Text style={styles.apiKeyDetailLabel}>Created:</Text>
                  <Text style={styles.apiKeyDetailValue}>
                    {new Date(selectedApiKey.createdAt).toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.apiUsageSection}>
                  <Text style={styles.apiUsageTitle}>How to use this API:</Text>
                  <Text style={styles.apiUsageText}>
                    1. Make a GET request to: {serverUrl}/transactions{'\n'}
                    2. Include header: X-API-Key: {selectedApiKey.key}{'\n'}
                    3. You'll receive structured JSON with your transactions
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonSecondary}
                    onPress={() => shareApiDetails(selectedApiKey)}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Share Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={() => setShowApiDetails(false)}
                  >
                    <Text style={styles.modalButtonTextPrimary}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101223' },
  logo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 10, paddingHorizontal: 10 },
  header: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 20, marginBottom: 10 },
  fundsCard: { backgroundColor: '#181A2A', borderRadius: 16, marginHorizontal: 16, padding: 20, marginBottom: 16 },
  fundsLabel: { color: '#B0B3C7', fontSize: 15 },
  fundsValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 6 },
  progressBarBg: { height: 8, backgroundColor: '#23254A', borderRadius: 8, marginTop: 8, marginBottom: 4, overflow: 'hidden' },
  progressBar: { height: 8, backgroundColor: '#2E4BFF', borderRadius: 8 },
  percentLeft: { color: '#B0B3C7', fontSize: 13, marginTop: 2 },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  filterTab: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16, backgroundColor: '#181A2A', marginHorizontal: 4 },
  filterTabActive: { backgroundColor: '#2E4BFF' },
  filterTabText: { color: '#B0B3C7', fontSize: 15 },
  filterTabTextActive: { color: '#fff', fontWeight: 'bold' },
  loading: { alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#fff' },
  empty: { fontSize: 16, color: '#B0B3C7', textAlign: 'center', marginTop: 30 },
  errorText: { color: '#FF5252', fontSize: 16, textAlign: 'center', marginTop: 30 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#181A2A', borderRadius: 16, padding: 18, marginHorizontal: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  cardIconCol: { marginRight: 16 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  manualTag: { color: '#6C63FF', fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
  cardSubtitle: { color: '#B0B3C7', fontSize: 15, marginTop: 2 },
  cardDate: { color: '#B0B3C7', fontSize: 13, marginTop: 2 },
  cardAmount: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  
  // API Key Management Styles
  sectionContainer: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 0 
  },
  generateButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    backgroundColor: '#2E4BFF' 
  },
  generateButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  emptyApiKeys: { 
    alignItems: 'center', 
    paddingVertical: 40,
    backgroundColor: '#181A2A', 
    borderRadius: 16,
    marginTop: 10 
  },
  emptyApiKeysText: { color: '#B0B3C7', fontSize: 16, marginTop: 10, fontWeight: '600' },
  emptyApiKeysSubtext: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  apiKeysList: { marginTop: 10 },
  apiKeyCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#181A2A', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 14, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2 
  },
  apiKeyInfo: { flex: 1 },
  apiKeyName: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  apiKeyDate: { color: '#B0B3C7', fontSize: 13, marginBottom: 2 },
  apiKeyStatus: { color: '#B0B3C7', fontSize: 13 },
  apiKeyActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: '#23254A', 
    marginLeft: 8 
  },
  deleteButton: { backgroundColor: '#3A1A1A' },
  
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.7)' 
  },
  modalContent: { 
    backgroundColor: '#181A2A', 
    padding: 24, 
    borderRadius: 16, 
    width: '90%', 
    maxHeight: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 16 
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 },
  modalSubtitle: { color: '#B0B3C7', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  modalInput: { 
    backgroundColor: '#23254A', 
    color: '#fff', 
    marginBottom: 20, 
    padding: 12, 
    borderRadius: 8,
    fontSize: 16
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 12
  },
  modalButtonSecondary: { 
    flex: 1,
    padding: 14, 
    borderRadius: 8, 
    backgroundColor: '#23254A',
    alignItems: 'center'
  },
  modalButtonTextSecondary: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalButtonPrimary: { 
    flex: 1,
    padding: 14, 
    borderRadius: 8, 
    backgroundColor: '#2E4BFF',
    alignItems: 'center'
  },
  modalButtonTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // API Key Details Styles
  apiKeyDetailSection: { 
    marginBottom: 12 
  },
  apiKeyDetailLabel: { 
    color: '#B0B3C7', 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 4 
  },
  apiKeyDetailValue: { 
    color: '#fff', 
    fontSize: 16,
    backgroundColor: '#23254A',
    padding: 8,
    borderRadius: 6,
    fontFamily: 'monospace'
  },
  apiUsageSection: { 
    marginTop: 20, 
    padding: 16, 
    backgroundColor: '#23254A', 
    borderRadius: 8 
  },
  apiUsageTitle: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  apiUsageText: { 
    color: '#B0B3C7', 
    fontSize: 14,
    lineHeight: 20
  },
});
