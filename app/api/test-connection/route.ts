import { NextResponse } from 'next/server';
import { createClient, executeWithRetry } from '@/lib/supabase-client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Create a client for testing
        const supabase = createClient();

        // Test connection with retry logic
        const { data: cards, error: cardsError } = await executeWithRetry(async () => {
            return await supabase
                .from('cards')
                .select('id, name')
                .limit(1);
        });

        if (cardsError) {
            console.error('Connection test failed:', cardsError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Database connection failed',
                    error: cardsError.message,
                    timestamp: new Date().toISOString()
                },
                { status: 500 }
            );
        }

        // Check server time to verify full connection
        const { data: timeData, error: timeError } = await executeWithRetry(async () => {
            return await supabase.rpc('get_server_time');
        }).catch(err => ({ data: null, error: err }));

        if (timeError) {
            console.warn('Server time check failed:', timeError);
        }

        return NextResponse.json({
            success: true,
            message: 'Connection is working correctly',
            timestamp: new Date().toISOString(),
            serverTime: timeData || null,
            testData: cards ? { count: cards.length } : null
        });
    } catch (error) {
        console.error('Test connection error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Connection test failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}