import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Popconfirm,
  message,
  Space,
} from 'antd';
import { Plus, Trash2, Edit2, Search, Package, Sparkles } from 'lucide-react';
import { fetchProducts, fetchCategories, fetchBrands } from '../../api/products';
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  uploadMediaFile,
} from '../../api/admin';
import { ProductListItem } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [form] = Form.useForm();

  // Queries
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: () => fetchProducts({ page_size: 100 }),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      message.success('Shoe added to archive.');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to create product.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateAdminProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      message.success('Product updated successfully.');
      setIsModalOpen(false);
      setEditingProduct(null);
      form.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to update product.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      message.success('Shoe soft-deleted from catalog.');
    },
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      gender: 'unisex',
      is_featured: false,
      is_active: true,
      variants: [
        { size: 'US 9', color_name: 'Core Black', color_hex: '#000000', sku: `SKU-${Date.now()}-9`, stock_quantity: 15 },
        { size: 'US 10', color_name: 'Core Black', color_hex: '#000000', sku: `SKU-${Date.now()}-10`, stock_quantity: 15 },
      ],
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          alt_text: 'Front view',
          is_primary: true,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: ProductListItem) => {
    setEditingProduct(record);
    form.setFieldsValue({
      name: record.name,
      slug: record.slug,
      short_description: record.short_description,
      brand_id: record.brand.id,
      category_id: record.category.id,
      gender: record.gender,
      base_price: Number(record.base_price),
      is_featured: record.is_featured,
      is_active: record.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        payload: {
          name: values.name,
          slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-'),
          short_description: values.short_description,
          description: values.description || values.name,
          brand_id: values.brand_id,
          category_id: values.category_id,
          gender: values.gender,
          base_price: values.base_price,
          is_featured: values.is_featured,
          is_active: values.is_active,
        },
      });
    } else {
      createMutation.mutate({
        ...values,
        slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-'),
        description: values.description || values.name,
      });
    }
  };

  // Filter products by search
  const filteredProducts = (productsData?.items || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Shoe',
      key: 'shoe',
      render: (_: any, record: ProductListItem) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
            {record.primary_image ? (
              <img
                src={record.primary_image}
                alt={record.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-slate-400 m-auto mt-3.5" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm hover:underline cursor-pointer">
              {record.name}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              {record.brand.name} • {record.category.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (
        <Tag className="uppercase text-[10px] font-bold">{gender}</Tag>
      ),
    },
    {
      title: 'Base Price',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (price: number) => (
        <span className="font-mono font-bold text-slate-900">
          ${Number(price).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Stock Units',
      dataIndex: 'total_stock',
      key: 'total_stock',
      render: (stock: number) => (
        <span
          className={`font-bold text-xs ${
            stock <= 5 ? 'text-rose-600 font-black' : 'text-slate-700'
          }`}
        >
          {stock} {stock <= 5 && '⚠️ (Low)'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: ProductListItem) => (
        <div className="flex items-center gap-1.5">
          {record.is_featured && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
              Featured
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              record.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {record.is_active ? 'Active' : 'Draft'}
          </span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ProductListItem) => (
        <Space size="middle">
          <button
            onClick={() => handleOpenEditModal(record)}
            className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <Popconfirm
            title="Soft delete product?"
            description="The product will be hidden from public catalog."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Yes, delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <button className="text-xs text-rose-600 hover:text-rose-900 font-semibold flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Inventory &amp; Variants
          </span>
          <h1 className="text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
            Sneaker Archive ({productsData?.total || 0})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage models, SKU variants, prices, inventory counts, and photography.
          </p>
        </div>
        <Button
          type="primary"
          onClick={handleOpenAddModal}
          icon={<Plus className="w-4 h-4" />}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-5 rounded-xl uppercase tracking-wider text-xs"
        >
          Add New Sneaker
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shoe name or brand..."
            className="pl-9 h-9 rounded-lg text-xs"
            allowClear
          />
        </div>
      </div>

      {/* Ant Design Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 12, showSizeChanger: true }}
        />
      </div>

      {/* Create / Edit Sneaker Modal */}
      <Modal
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Add New Sneaker Model'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={760}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          className="pt-4 max-h-[75vh] overflow-y-auto px-1"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Product Name"
              rules={[{ required: true, message: 'Please enter sneaker name' }]}
            >
              <Input placeholder="e.g. Air Jordan 4 Retro 'Bred Reimagined'" />
            </Form.Item>

            <Form.Item name="slug" label="URL Slug (Auto-generated if empty)">
              <Input placeholder="e.g. air-jordan-4-retro-bred" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="brand_id"
              label="Brand"
              rules={[{ required: true, message: 'Select brand' }]}
            >
              <Select placeholder="Select Brand">
                {brands.map((b) => (
                  <Select.Option key={b.id} value={b.id}>
                    {b.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Category"
              rules={[{ required: true, message: 'Select category' }]}
            >
              <Select placeholder="Select Category">
                {categories.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="unisex">Unisex</Select.Option>
                <Select.Option value="men">Men</Select.Option>
                <Select.Option value="women">Women</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="base_price"
              label="Base Price ($)"
              rules={[{ required: true, message: 'Price is required' }]}
            >
              <InputNumber min={1} precision={2} className="w-full" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-2 pt-8">
              <Form.Item name="is_featured" valuePropName="checked">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input type="checkbox" className="rounded" />
                  Featured Drop
                </label>
              </Form.Item>
              <Form.Item name="is_active" valuePropName="checked">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Active / Visible
                </label>
              </Form.Item>
            </div>
          </div>

          <Form.Item name="short_description" label="Short Sub-headline">
            <Input placeholder="e.g. Crafted with premium full-grain nubuck and classic mesh netting." />
          </Form.Item>

          <Form.Item name="description" label="Editorial Silhouette Story">
            <Input.TextArea rows={3} placeholder="The legacy of the silhouette begins..." />
          </Form.Item>

          {/* Variants section if creating */}
          {!editingProduct && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Initial Sizing Variants
              </h4>
              <Form.List name="variants">
                {(fields, { add, remove }) => (
                  <div className="space-y-2">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <Form.Item
                          {...restField}
                          name={[name, 'size']}
                          rules={[{ required: true, message: 'Size required' }]}
                          className="mb-0 w-24"
                        >
                          <Input placeholder="US 9.5" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'color_name']}
                          rules={[{ required: true, message: 'Color required' }]}
                          className="mb-0 flex-1"
                        >
                          <Input placeholder="Color e.g. Bred" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'sku']}
                          rules={[{ required: true, message: 'SKU required' }]}
                          className="mb-0 flex-1"
                        >
                          <Input placeholder="SKU-AJ4-95" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'stock_quantity']}
                          rules={[{ required: true }]}
                          className="mb-0 w-24"
                        >
                          <InputNumber placeholder="Qty" min={0} className="w-full" />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          onClick={() => remove(name)}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          size: 'US 11',
                          color_name: 'Core Black',
                          color_hex: '#000000',
                          sku: `SKU-${Date.now()}`,
                          stock_quantity: 10,
                        })
                      }
                      block
                      className="text-xs"
                    >
                      + Add Sizing Variant
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-6 border-t border-slate-200 mt-4">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="bg-slate-900 text-white font-bold"
            >
              {editingProduct ? 'Save Updates' : 'Add to Footwear Archive'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
