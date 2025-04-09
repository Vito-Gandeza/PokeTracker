import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Create a client for testing
const supabase = createClient();

export async function GET() {
    try {
        // Test regular client
        const { data: cards, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .limit(1);

        if (cardsError) {
            console.error('Regular client error:', cardsError);
            return NextResponse.json(
                { error: 'Regular client connection failed', details: cardsError },
                { status: 500 }
            );
        }

        // We're not testing admin client in this version
        const users = null;

        return NextResponse.json({
            success: true,
            message: 'Supabase connection is working correctly',
            cards: cards,
            users: users,
            adminAvailable: false
        });
    } catch (error) {
        console.error('Test connection error:', error);
        return NextResponse.json(
            { error: 'Connection test failed', details: error },
            { status: 500 }
        );
    }
}