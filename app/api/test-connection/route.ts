import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

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

        // Test admin client only if it's available
        let users = null;
        let usersError = null;

        if (supabaseAdmin) {
            const result = await supabaseAdmin
                .from('profiles')
                .select('*')
                .limit(1);
            users = result.data;
            usersError = result.error;

            if (usersError) {
                console.error('Admin client error:', usersError);
                return NextResponse.json(
                    { error: 'Admin client connection failed', details: usersError },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Supabase connection is working correctly',
            cards: cards,
            users: users,
            adminAvailable: !!supabaseAdmin
        });
    } catch (error) {
        console.error('Test connection error:', error);
        return NextResponse.json(
            { error: 'Connection test failed', details: error },
            { status: 500 }
        );
    }
} 