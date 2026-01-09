import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscriber from '@/models/subscriber';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email address' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if subscriber exists
        const existing = await Subscriber.findOne({
            email: email.toLowerCase().trim()
        }).lean();

        if (!existing) {
            return NextResponse.json({
                success: false,
                error: 'Email not found'
            }, { status: 404 });
        }

        if (existing.status === 'unsubscribed') {
            return NextResponse.json({
                success: true,
                message: 'Already unsubscribed'
            });
        }

        // Unsubscribe user
        await Subscriber.updateOne(
            { email: email.toLowerCase().trim() },
            {
                $set: {
                    status: 'unsubscribed',
                    unsubscribed_at: new Date(),
                    updated_at: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Successfully unsubscribed'
        });

    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}
