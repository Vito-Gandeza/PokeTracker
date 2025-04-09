'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import ProtectedRoute from '@/components/protected-route';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  shipping_address?: string;
  phone_number?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  card_id: string;
  quantity: number;
  price: number;
  card_name?: string;
  card_image?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    // Use the userProfile from auth context instead of fetching again
    if (userProfile) {
      setProfile(userProfile as unknown as Profile);
      setUsername(userProfile.username || '');
      setFullName(userProfile.full_name || '');
      setShippingAddress(userProfile.shipping_address || '');
      setPhoneNumber(userProfile.phone_number || '');
      setShowLoading(false);
    }
  }, [userProfile]);

  // Fetch order history
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      setLoadingOrders(true);
      try {
        const supabase = createClient();

        // Get orders
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (orderError) throw orderError;

        if (!orderData || orderData.length === 0) {
          setOrders([]);
          setLoadingOrders(false);
          return;
        }

        // Get order items for each order
        const ordersWithItems = await Promise.all(
          orderData.map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*, cards(name, image_url)')
              .eq('order_id', order.id);

            if (itemsError) throw itemsError;

            // Format items with card details
            const formattedItems = itemsData.map(item => ({
              id: item.id,
              card_id: item.card_id,
              quantity: item.quantity,
              price: item.price,
              card_name: item.cards?.name || 'Unknown Card',
              card_image: item.cards?.image_url || '/images/card-placeholder.png'
            }));

            return {
              ...order,
              items: formattedItems
            };
          })
        );

        setOrders(ordersWithItems);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchOrders();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setShowLoading(true);
    setUpdateError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({
          username: username,
          full_name: fullName,
          shipping_address: shippingAddress,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      setUpdateSuccess(true);

      // Update local state
      setProfile({
        ...profile!,
        username,
        full_name: fullName,
        shipping_address: shippingAddress,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString()
      });

      // Show success message
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setUpdateError('Failed to update profile');
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />

        <main className="flex-1 container max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

          {showLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
          ) : profileError ? (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
              Error loading profile: {profileError.message}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              {updateError && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded mb-4">
                  Profile updated successfully!
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing || isUpdating}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing || isUpdating}
                    className={!isEditing ? 'bg-gray-100' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                  <Input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    disabled={!isEditing || isUpdating}
                    className={!isEditing ? 'bg-gray-100' : ''}
                    placeholder="Enter your shipping address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={!isEditing || isUpdating}
                    className={!isEditing ? 'bg-gray-100' : ''}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="bg-black hover:bg-gray-800"
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-black hover:bg-gray-800"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Order History</h2>
            {loadingOrders ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">You haven't placed any orders yet.</p>
                <Button
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => router.push('/shop')}
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex flex-wrap justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Order #{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${order.total_amount.toFixed(2)}</p>
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-medium mb-2">Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded">
                              <img
                                src={item.card_image}
                                alt={item.card_name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.card_name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Shipping Address</h3>
                          <p className="text-sm text-gray-500">{order.shipping_address}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-1">Payment Method</h3>
                          <p className="text-sm text-gray-500">
                            {order.payment_method === 'credit-card' ? 'Credit/Debit Card' :
                             order.payment_method === 'gcash' ? 'GCash' : 'Cash on Delivery'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <SiteFooter />
      </div>
    </ProtectedRoute>
  );
}