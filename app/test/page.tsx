'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function TestPage() {
    const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
    const [cards, setCards] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [envStatus, setEnvStatus] = useState<string>('Checking environment...');

    useEffect(() => {
        // Check environment variables
        const checkEnv = () => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!url || !key) {
                setEnvStatus('Missing environment variables. Please check your .env file.');
                setError('Required environment variables are missing. Check the console for details.');
                console.error('Missing Supabase environment variables:');
                if (!url) console.error('- NEXT_PUBLIC_SUPABASE_URL');
                if (!key) console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
                return false;
            }

            setEnvStatus('Environment variables are set correctly.');
            return true;
        };

        async function testConnection() {
            if (!checkEnv()) return;

            try {
                // Create a client and test connection
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('cards')
                    .select('*')
                    .limit(5);

                if (error) {
                    if (error.message.includes('relation "cards" does not exist')) {
                        setError('Database tables not found. Please run the migrations first.');
                        setConnectionStatus('Tables missing');
                    } else {
                        setError(`Connection failed: ${error.message}`);
                        setConnectionStatus('Failed');
                    }
                    return;
                }

                setCards(data || []);
                setConnectionStatus('Connected successfully!');
            } catch (err) {
                console.error('Connection error:', err);
                setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                setConnectionStatus('Failed');
            }
        }

        testConnection();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
                <p className="mb-2">Status: {envStatus}</p>
                <div className="bg-gray-100 p-4 rounded">
                    <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
                    <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
                </div>
            </div>

            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
                <p className="mb-2">Status: {connectionStatus}</p>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p>{error}</p>
                    </div>
                )}
            </div>

            {cards.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">Sample Data</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(cards, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}