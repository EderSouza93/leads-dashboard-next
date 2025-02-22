import { NextResponse } from 'next/server';
import { syncCurrent, syncLeadsRange } from '@/services/leadSyncService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fullSync = searchParams.get('full') === 'true';

    try {
        if(fullSync) {
            await syncLeadsRange(15);
            return NextResponse.json({ message: 'Full Sync completed '})
        } else {
            await syncCurrent()
            return NextResponse.json({ message: 'Current day sync completed' })
        }
    } catch (error) {
        console.error('Error in the sync:', error);
        return NextResponse.json(
            { error: 'Error synchronizing leads', deatails: (error as Error).message },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';