import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Popconfirm, message, Space } from 'antd';
import { Star, CheckCircle, XCircle, Trash2, Award } from 'lucide-react';
import { fetchAdminReviews, updateReviewStatus, deleteReview, AdminReviewListItem } from '../../api/admin';

export const AdminReviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', statusFilter],
    queryFn: () =>
      fetchAdminReviews({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page_size: 50,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateReviewStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      message.success('Review moderation status updated.');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to update review status.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      message.success('Review deleted permanently.');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to delete review.');
    },
  });

  const columns = [
    {
      title: 'Shoe Model',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (name: string) => (
        <span className="font-bold text-slate-900 text-xs">{name}</span>
      ),
    },
    {
      title: 'Author',
      key: 'customer',
      render: (_: any, record: AdminReviewListItem) => (
        <div>
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
            <span>{record.customer_name}</span>
            {record.is_verified_purchase && (
              <span title="Verified Buyer">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">{record.customer_email}</div>
        </div>
      ),
    },
    {
      title: 'Rating & Feedback',
      key: 'review',
      render: (_: any, record: AdminReviewListItem) => (
        <div className="max-w-md space-y-1">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: record.rating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
            <span className="text-slate-900 font-bold text-xs ml-1">{record.rating}.0</span>
          </div>
          <div className="font-bold text-slate-900 text-xs">{record.title}</div>
          <div className="text-slate-600 text-xs leading-relaxed">{record.comment}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => {
        if (st === 'approved') return <Tag color="green" className="font-bold uppercase text-[10px]">Approved</Tag>;
        if (st === 'rejected') return <Tag color="red" className="font-bold uppercase text-[10px]">Rejected</Tag>;
        return <Tag color="gold" className="font-bold uppercase text-[10px]">Pending</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => (
        <span className="text-xs text-slate-500">
          {new Date(d).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AdminReviewListItem) => (
        <Space size="small">
          {record.status !== 'approved' && (
            <Button
              size="small"
              onClick={() => statusMutation.mutate({ id: record.id, status: 'approved' })}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            >
              Approve
            </Button>
          )}
          {record.status !== 'rejected' && (
            <Button
              size="small"
              onClick={() => statusMutation.mutate({ id: record.id, status: 'rejected' })}
              className="text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
            >
              Reject
            </Button>
          )}
          <Popconfirm
            title="Permanently remove review?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<Trash2 className="w-3 h-3" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Client Feedback &amp; Ratings
        </span>
        <h1 className="text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
          Review Moderation ({data?.total || 0})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Approve authentic client impressions and remove spam or abusive submissions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-2">
        {['all', 'approved', 'rejected', 'pending'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              statusFilter === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15 }}
        />
      </div>
    </div>
  );
};
