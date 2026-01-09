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

        // Check if subscriber already exists
        const existing = await Subscriber.findOne({
            email: email.toLowerCase().trim()
        });

        if (existing) {
            if (existing.status === 'active') {
                return NextResponse.json({
                    success: true,
                    message: 'Already subscribed',
                    isNew: false
                });
            }

            // Reactivate unsubscribed user
            existing.status = 'active';
            existing.updated_at = new Date();
            existing.resubscribed_at = new Date();
            existing.unsubscribed_at = null;
            await existing.save();

            return NextResponse.json({
                success: true,
                message: 'Subscription reactivated',
                isNew: false
            });
        }

        // Create new subscriber
        await Subscriber.create({
            email: email.toLowerCase().trim(),
            status: 'active',
            subscribed_at: new Date(),
            updated_at: new Date(),
            source: 'website',
            unsubscribed_at: null
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully subscribed',
            isNew: true
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to subscribe' },
            { status: 500 }
        );
    }
}
