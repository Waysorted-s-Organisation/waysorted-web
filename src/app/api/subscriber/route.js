// app/api/subscribe/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function POST(request) {
  try {
    // Parse the request body
    const { email } = await request.json();
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        tls: true, // or ssl: true
        tlsAllowInvalidCertificates: true // if testing with self-signed
      });
      
    await client.connect();
    
    const database = client.db('myapp');
    const subscribers = database.collection('subscribers');
    
    // Check if email already exists
    const existingUser = await subscribers.findOne({ email });
    
    if (existingUser) {
      await client.close();
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 }
      );
    }
    
    // Add email to database
    const result = await subscribers.insertOne({ 
      email, 
      createdAt: new Date() 
    });
    
    // Close the connection
    await client.close();
    
    // Return success response
    return NextResponse.json(
      { 
        message: 'Subscription successful',
        id: result.insertedId
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error processing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}