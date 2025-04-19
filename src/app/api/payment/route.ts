// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

// In app/api/payment/route.ts
export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const { amount, maintenanceId, userId } = body;
  
      if (!amount || !maintenanceId || !userId) {
        return NextResponse.json({ error: "Missing required data" }, { status: 400 });
      }
  
      // Create a shorter receipt string that's under 40 characters
      const receipt = `maint_${maintenanceId.substring(0, 8)}`;
  
      // Create Razorpay order
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: receipt,
        notes: {
          userId,
          maintenanceId,
        },
      };
  
      const order = await razorpay.orders.create(options);
  
      return NextResponse.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      });
    } catch (err: any) {
      console.error("Razorpay Error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
// Add a verification endpoint for Razorpay webhooks
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      // Payment is verified
      // You can update your database here to mark the payment as completed
      
      return NextResponse.json({ 
        success: true,
        message: "Payment verified successfully" 
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: "Payment verification failed" 
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Verification Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}