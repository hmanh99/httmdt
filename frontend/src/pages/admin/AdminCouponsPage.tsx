import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Popconfirm, message } from 'antd';
import { Plus, Trash2, Ticket, Percent } from 'lucide-react';
import { fetchAdminCoupons, createAdminCoupon, deleteAdminCoupon, CouponItem } from '../../api/admin';

export const AdminCouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: fetchAdminCoupons,
  });

  const createMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      message.success('Promo discount coupon created.');
      setModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to create coupon.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      message.success('Coupon removed.');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to delete coupon.');
    },
  });

  const columns = [
    {
      title: 'Coupon Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {code}
        </span>
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_: any, record: CouponItem) => (
        <span className="font-bold text-xs text-slate-900">
          {record.discount_type === 'percentage'
            ? `${record.discount_value}% OFF`
            : `$${Number(record.discount_value).toFixed(2)} OFF`}
        </span>
      ),
    },
    {
      title: 'Min. Order Subtotal',
      dataIndex: 'min_order_amount',
      key: 'min_order_amount',
      render: (min: number) => (
        <span className="text-xs text-slate-600 font-mono">
          ${Number(min).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_: any, record: CouponItem) => (
        <span className="text-xs text-slate-700">
          {record.times_used} {record.max_uses ? `/ ${record.max_uses}` : 'uses (Unlimited)'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'} className="font-bold uppercase text-[10px]">
          {active ? 'Active' : 'Expired / Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CouponItem) => (
        <Popconfirm
          title="Delete promo coupon?"
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<Trash2 className="w-3 h-3" />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Promotions &amp; Discounts
          </span>
          <h1 className="text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
            Discount Coupons ({coupons.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure seasonal codes, VIP influencer coupons, and minimum order requirements.
          </p>
        </div>
        <Button
          type="primary"
          onClick={() => {
            form.resetFields();
            setModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-5 rounded-xl uppercase tracking-wider text-xs"
        >
          Create Promo Code
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table
          columns={columns}
          dataSource={coupons}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </div>

      {/* Create Coupon Modal */}
      <Modal
        title="Create Promotional Coupon"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            discount_type: 'percentage',
            discount_value: 15,
            min_order_amount: 50,
          }}
          onFinish={(vals) =>
            createMutation.mutate({
              ...vals,
              code: vals.code.toUpperCase().trim(),
            })
          }
          className="pt-2"
        >
          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[{ required: true, message: 'Please enter a coupon code' }]}
          >
            <Input placeholder="e.g. SUMMER25" className="font-mono uppercase" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="discount_type" label="Type" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="percentage">Percentage (%)</Select.Option>
                <Select.Option value="fixed">Fixed Dollar ($)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="discount_value"
              label="Value"
              rules={[{ required: true, message: 'Value required' }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="min_order_amount" label="Min. Order Subtotal ($)">
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="max_uses" label="Usage Limit (Empty for infinite)">
              <InputNumber min={1} className="w-full" placeholder="Unlimited" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              className="bg-slate-900 text-white font-bold"
            >
              Issue Coupon
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
