'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { CheckCircle2, CreditCard, Truck, MapPin } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: userProfile?.full_name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Philippines',
    phoneNumber: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate API call to create order
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save order to database
      const supabase = createClient();
      
      // Create order record
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          total_amount: totalPrice,
          status: 'completed',
          shipping_address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.zipCode}, ${formData.country}`,
          payment_method: paymentMethod,
          contact_number: formData.phoneNumber
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        card_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Save shipping address to user profile if it doesn't exist
      if (!userProfile?.shipping_address) {
        const { error: profileError } = await supabase
          .from('users')
          .update({
            shipping_address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.zipCode}, ${formData.country}`,
            phone_number: formData.phoneNumber
          })
          .eq('id', user?.id);
        
        if (profileError) console.error('Error updating profile:', profileError);
      }
      
      // Show success state
      setOrderComplete(true);
      
      // Clear cart after successful order
      clearCart();
      
      // Redirect to order confirmation after a delay
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
      
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        
        <main className="flex-1 container max-w-6xl mx-auto py-8 px-4">
          {orderComplete ? (
            <Card className="mx-auto max-w-md">
              <CardHeader className="text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <CardTitle className="text-2xl">Order Complete!</CardTitle>
                <CardDescription>
                  Thank you for your purchase. Your order has been successfully placed.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">
                  We've sent a confirmation email to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to your profile page in a few seconds...
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="md:col-span-2">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                
                <form onSubmit={handleSubmit}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <CardTitle>Shipping Information</CardTitle>
                      </div>
                      <CardDescription>
                        Enter your shipping details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input 
                            id="fullName" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleInputChange} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                          id="address" 
                          name="address" 
                          value={formData.address} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input 
                            id="city" 
                            name="city" 
                            value={formData.city} 
                            onChange={handleInputChange} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province</Label>
                          <Input 
                            id="state" 
                            name="state" 
                            value={formData.state} 
                            onChange={handleInputChange} 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                          <Input 
                            id="zipCode" 
                            name="zipCode" 
                            value={formData.zipCode} 
                            onChange={handleInputChange} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input 
                            id="country" 
                            name="country" 
                            value={formData.country} 
                            onChange={handleInputChange} 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input 
                          id="phoneNumber" 
                          name="phoneNumber" 
                          value={formData.phoneNumber} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </CardContent>
                    
                    <Separator />
                    
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <CardTitle>Payment Method</CardTitle>
                      </div>
                      <CardDescription>
                        Select your preferred payment method
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup 
                        defaultValue="credit-card" 
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                          <RadioGroupItem value="credit-card" id="credit-card" />
                          <Label htmlFor="credit-card" className="flex-1 cursor-pointer">Credit/Debit Card</Label>
                          <div className="flex gap-1">
                            <Image src="/images/visa.svg" alt="Visa" width={32} height={20} />
                            <Image src="/images/mastercard.svg" alt="Mastercard" width={32} height={20} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                          <RadioGroupItem value="gcash" id="gcash" />
                          <Label htmlFor="gcash" className="flex-1 cursor-pointer">GCash</Label>
                          <Image src="/images/gcash.svg" alt="GCash" width={32} height={20} />
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="flex-1 cursor-pointer">Cash on Delivery</Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.back()}
                        disabled={isProcessing}
                      >
                        Back to Cart
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={isProcessing || items.length === 0}
                      >
                        {isProcessing ? 'Processing...' : `Complete Order • $${totalPrice.toFixed(2)}`}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </div>
              
              {/* Order Summary */}
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-500" />
                      <CardTitle>Order Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Your cart is empty</p>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="relative h-12 w-12 overflow-hidden rounded">
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Subtotal</span>
                            <span className="text-sm">${totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Shipping</span>
                            <span className="text-sm">$0.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Tax</span>
                            <span className="text-sm">$0.00</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>${totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
        
        <SiteFooter />
      </div>
    </ProtectedRoute>
  );
}
