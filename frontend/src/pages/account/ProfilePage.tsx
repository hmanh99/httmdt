import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Form, Input, Button, Modal, message, Tabs } from 'antd';
import { useAuthStore } from '../../store/authStore';
import {
  apiUpdateMe,
  apiChangePassword,
  apiGetAddresses,
  apiCreateAddress,
  apiDeleteAddress,
  AddressItem,
} from '../../api/auth';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [addressForm] = Form.useForm();

  // Load addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: apiGetAddresses,
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: apiUpdateMe,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      message.success('Personal profile details updated.');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to update profile.');
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: apiChangePassword,
    onSuccess: () => {
      message.success('Password updated successfully.');
      passwordForm.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to update password.');
    },
  });

  // Create Address Mutation
  const createAddressMutation = useMutation({
    mutationFn: apiCreateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      message.success('Delivery address added to address book.');
      setAddressModalOpen(false);
      addressForm.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to add address.');
    },
  });

  // Delete Address Mutation
  const deleteAddressMutation = useMutation({
    mutationFn: apiDeleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      message.success('Address removed.');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Account Settings
        </span>
        <h1 className="text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
          Client Profile &amp; Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal identity, delivery addresses, and security credentials.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <Tabs
          defaultActiveKey="personal"
          items={[
            {
              key: 'personal',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  Personal Information
                </span>
              ),
              children: (
                <div className="max-w-xl py-4">
                  <Form
                    form={profileForm}
                    layout="vertical"
                    initialValues={{
                      first_name: user?.first_name,
                      last_name: user?.last_name,
                      phone: user?.phone,
                    }}
                    onFinish={(vals) => updateProfileMutation.mutate(vals)}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="first_name"
                        label={<span className="text-xs font-bold uppercase text-slate-700">First Name</span>}
                        rules={[{ required: true, message: 'Please enter your first name' }]}
                      >
                        <Input className="h-10 rounded-lg text-sm" />
                      </Form.Item>
                      <Form.Item
                        name="last_name"
                        label={<span className="text-xs font-bold uppercase text-slate-700">Last Name</span>}
                        rules={[{ required: true, message: 'Please enter your last name' }]}
                      >
                        <Input className="h-10 rounded-lg text-sm" />
                      </Form.Item>
                    </div>

                    <Form.Item
                      label={<span className="text-xs font-bold uppercase text-slate-700">Email Address (Read-only)</span>}
                    >
                      <Input value={user?.email} disabled className="h-10 rounded-lg text-sm bg-slate-100" />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      label={<span className="text-xs font-bold uppercase text-slate-700">Phone Number</span>}
                    >
                      <Input placeholder="+1 (555) 000-0000" className="h-10 rounded-lg text-sm" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updateProfileMutation.isPending}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-lg uppercase tracking-wider text-xs"
                    >
                      Save Changes
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: 'addresses',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  Delivery Addresses ({addresses.length})
                </span>
              ),
              children: (
                <div className="py-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Saved locations used for rapid single-click checkout.
                    </p>
                    <Button
                      type="default"
                      onClick={() => setAddressModalOpen(true)}
                      icon={<Plus className="w-3.5 h-3.5" />}
                      className="text-xs font-bold uppercase tracking-wider rounded-lg h-9"
                    >
                      Add New Address
                    </Button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">No Saved Delivery Addresses</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Add your primary delivery address to speed up order completion.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-900">
                              {addr.recipient_name}
                            </span>
                            {addr.is_default_shipping && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Default Shipping
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">
                            {addr.street_address} {addr.apartment}
                          </p>
                          <p className="text-xs text-slate-600">
                            {addr.city}, {addr.state} {addr.postal_code}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">Phone: {addr.phone}</p>

                          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                            <button
                              onClick={() => deleteAddressMutation.mutate(addr.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'security',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  Security &amp; Password
                </span>
              ),
              children: (
                <div className="max-w-md py-4">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={(vals) => changePasswordMutation.mutate(vals)}
                  >
                    <Form.Item
                      name="current_password"
                      label={<span className="text-xs font-bold uppercase text-slate-700">Current Password</span>}
                      rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                      <Input.Password className="h-10 rounded-lg text-sm" />
                    </Form.Item>

                    <Form.Item
                      name="new_password"
                      label={<span className="text-xs font-bold uppercase text-slate-700">New Password</span>}
                      rules={[
                        { required: true, message: 'Please enter your new password' },
                        { min: 8, message: 'Password must be at least 8 characters' },
                      ]}
                    >
                      <Input.Password className="h-10 rounded-lg text-sm" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={changePasswordMutation.isPending}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-lg uppercase tracking-wider text-xs"
                    >
                      Update Password
                    </Button>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Add Address Modal */}
      <Modal
        title="Add New Delivery Address"
        open={addressModalOpen}
        onCancel={() => setAddressModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={addressForm}
          layout="vertical"
          onFinish={(vals) => createAddressMutation.mutate({ ...vals, is_default_shipping: true })}
          className="pt-2"
        >
          <Form.Item
            name="recipient_name"
            label="Full Name / Recipient"
            rules={[{ required: true, message: 'Recipient name is required' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: 'Phone number is required' }]}
          >
            <Input placeholder="+1 555-0199" />
          </Form.Item>

          <Form.Item
            name="street_address"
            label="Street Address"
            rules={[{ required: true, message: 'Street address is required' }]}
          >
            <Input placeholder="123 Sneaker Blvd" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="city" label="City" rules={[{ required: true }]}>
              <Input placeholder="New York" />
            </Form.Item>
            <Form.Item name="state" label="State / Region" rules={[{ required: true }]}>
              <Input placeholder="NY" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="postal_code" label="ZIP / Postal Code" rules={[{ required: true }]}>
              <Input placeholder="10001" />
            </Form.Item>
            <Form.Item name="country" label="Country" initialValue="US">
              <Input disabled />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setAddressModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createAddressMutation.isPending}
              className="bg-slate-900 text-white"
            >
              Save Address
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
