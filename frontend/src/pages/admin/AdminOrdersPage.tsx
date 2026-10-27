import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Select, Input, Tag, message } from 'antd';
import { Search, ShoppingBag, Eye, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus, AdminOrderListItem } from '../../api/admin';

export const AdminOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderListItem | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, search],
    queryFn: () =>
      fetchAdminOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
        page_size: 50,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) =>
      updateOrderStatus(orderId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      message.success('Order status updated.');
      setStatusModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to update order status.');
    },
  });

  const handleOpenStatusModal = (record: AdminOrderListItem) => {
    setSelectedOrder(record);
    form.setFieldsValue({
      status: record.status,
      admin_notes: '',
    });
    setStatusModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Tag color="blue" className="font-bold uppercase text-[10px]">Paid</Tag>;
      case 'processing':
        return <Tag color="gold" className="font-bold uppercase text-[10px]">Processing</Tag>;
      case 'shipped':
        return <Tag color="purple" className="font-bold uppercase text-[10px]">Shipped</Tag>;
      case 'delivered':
        return <Tag color="green" className="font-bold uppercase text-[10px]">Delivered</Tag>;
      case 'cancelled':
        return <Tag color="red" className="font-bold uppercase text-[10px]">Cancelled</Tag>;
      default:
        return <Tag className="font-bold uppercase text-[10px]">{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (num: string) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {num}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: AdminOrderListItem) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{record.customer_name}</div>
          <div className="text-[11px] text-slate-400">{record.customer_email}</div>
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'item_count',
      key: 'item_count',
      render: (cnt: number) => (
        <span className="text-xs font-semibold text-slate-600">{cnt} pair{cnt > 1 ? 's' : ''}</span>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amt: number) => (
        <span className="font-mono font-bold text-slate-950 text-xs">
          ${Number(amt).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => getStatusBadge(st),
    },
    {
      title: 'Order Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => (
        <span className="text-xs text-slate-500">
          {new Date(d).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Fulfillment',
      key: 'action',
      render: (_: any, record: AdminOrderListItem) => (
        <Button
          size="small"
          onClick={() => handleOpenStatusModal(record)}
          className="text-xs font-bold"
        >
          Update Status
        </Button>
      ),
    },
  ];

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Fulfillment &amp; Shipping
        </span>
        <h1 className="text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
          Client Orders ({data?.total || 0})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review placed orders, manage fulfillment pipeline, and track package deliveries.
        </p>
      </div>

      {/* Tabs and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or email..."
            className="pl-9 h-9 rounded-lg text-xs"
            allowClear
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
        />
      </div>

      {/* Status Update Modal */}
      <Modal
        title={`Update Order ${selectedOrder?.order_number}`}
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(vals) =>
            updateStatusMutation.mutate({
              orderId: selectedOrder!.id,
              status: vals.status,
              notes: vals.admin_notes,
            })
          }
          className="pt-2"
        >
          <Form.Item name="status" label="Workflow Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="processing">Processing</Select.Option>
              <Select.Option value="shipped">Shipped</Select.Option>
              <Select.Option value="delivered">Delivered</Select.Option>
              <Select.Option value="cancelled">Cancelled (Restores stock)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="admin_notes" label="Fulfillment Notes / Tracking Code">
            <Input.TextArea rows={3} placeholder="Tracking # or dispatch remarks..." />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateStatusMutation.isPending}
              className="bg-slate-900 text-white font-bold"
            >
              Update Order
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
