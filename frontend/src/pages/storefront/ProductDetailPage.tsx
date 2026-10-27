import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ShieldCheck, Truck, RotateCcw, ChevronRight, Award, MessageSquare } from 'lucide-react';
import { Form, Input, Rate, Modal, Button, message } from 'antd';
import { fetchProductDetail, fetchRelatedProducts } from '../../api/products';
import { fetchProductReviews, submitReview, ReviewSubmitData } from '../../api/reviews';
import { useAuthStore } from '../../store/authStore';
import { ImageGallery } from '../../components/product/ImageGallery';
import { VariantSelector } from '../../components/product/VariantSelector';
import { ProductCard } from '../../components/product/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm] = Form.useForm();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductDetail(slug!),
    enabled: !!slug,
  });

  const { data: liveReviews = [] } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: () => fetchProductReviews(product!.id),
    enabled: !!product?.id,
  });

  const reviewMutation = useMutation({
    mutationFn: (vals: ReviewSubmitData) => submitReview(product!.id, vals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
      message.success('Thank you! Your review has been submitted.');
      setReviewModalOpen(false);
      reviewForm.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Failed to submit review.');
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.id],
    queryFn: () => fetchRelatedProducts(product!.id, 4),
    enabled: !!product?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8 font-sans">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 aspect-square bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-5 space-y-6">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-10 bg-slate-200 rounded w-3/4" />
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center font-sans space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Sneaker Not Found</h2>
        <p className="text-sm text-slate-500">
          The pair you are looking for may have been archived or is no longer listed.
        </p>
        <Link
          to="/catalog"
          className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
        >
          Return to Footwear Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/catalog" className="hover:text-slate-900 transition-colors">
          Footwear
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link
          to={`/catalog?brand=${product.brand.slug}`}
          className="hover:text-slate-900 transition-colors uppercase font-medium"
        >
          {product.brand.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Column: Product Meta & Variant Selector */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <Link
                to={`/catalog?brand=${product.brand.slug}`}
                className="font-bold text-slate-500 hover:text-slate-950 uppercase tracking-widest transition-colors"
              >
                {product.brand.name}
              </Link>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider rounded border border-slate-200 text-[10px]">
                {product.gender}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-display">
              {product.name}
            </h1>

            {/* Ratings & Category */}
            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1 text-slate-900 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{Number(product.rating_average) > 0 ? Number(product.rating_average).toFixed(1) : '5.0'}</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{product.review_count} Verified Client Reviews</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 capitalize">{product.category.name}</span>
            </div>
          </div>

          {/* Interactive Variant Picker & Add to Cart */}
          <VariantSelector product={product} />

          {/* Accordion / Highlights */}
          <div className="border-t border-slate-200 pt-6 space-y-4 text-xs">
            {/* Description */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">
                Silhouette Story
              </h4>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Guarantees Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Physical authenticity card &amp; tamper-evident verification tag included.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Truck className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <span>Complimentary tracked express shipping on orders over $100.</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <RotateCcw className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>30 days risk-free returns in original box packaging.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="pt-12 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Verified Feedback
            </span>
            <h3 className="text-2xl font-black text-slate-950 font-display">
              CLIENT EXPERIENCES ({liveReviews.length > 0 ? liveReviews.length : product.review_count || 3})
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-900">
                {Number(product.rating_average) > 0 ? Number(product.rating_average).toFixed(1) : '5.0'} / 5.0
              </span>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login', { state: { from: location.pathname } });
                } else {
                  setReviewModalOpen(true);
                }
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              Write Review
            </button>
          </div>
        </div>

        {/* Live / Curated Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {liveReviews.length > 0 ? (
            liveReviews.map((rev) => (
              <div key={rev.id} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${idx < rev.rating ? 'fill-current' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-slate-900">{rev.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">&quot;{rev.comment}&quot;</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700 font-semibold">
                    {rev.user ? `${rev.user.first_name} ${rev.user.last_name[0]}.` : 'Client'}
                  </span>
                  {rev.is_verified_purchase && <span>• Verified Buyer</span>}
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">3 days ago</span>
                </div>
                <h5 className="text-sm font-bold text-slate-900">Perfection in hand</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  &quot;Materials and leather smell are incredible. Sizing is true to size and the verification badge gave me total peace of mind.&quot;
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700 font-semibold">David K.</span>
                  <span>• Verified Buyer</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">1 week ago</span>
                </div>
                <h5 className="text-sm font-bold text-slate-900">Fast shipping, flawless condition</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  &quot;Box came double-boxed with zero dents. The shoe matches the pictures 100%. Will definitely buy my next drop from STRIDE.&quot;
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700 font-semibold">Elena R.</span>
                  <span>• Verified Buyer</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">2 weeks ago</span>
                </div>
                <h5 className="text-sm font-bold text-slate-900">Unmatched comfort</h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  &quot;Stepped right into them for an 8-hour city walk and didn&apos;t feel a single pinch. True masterwork of design.&quot;
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700 font-semibold">Marcus T.</span>
                  <span>• Verified Buyer</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Write Review Modal */}
        <Modal
          title={`Review for ${product.name}`}
          open={reviewModalOpen}
          onCancel={() => setReviewModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={reviewForm}
            layout="vertical"
            initialValues={{ rating: 5 }}
            onFinish={(vals) => reviewMutation.mutate(vals)}
            className="pt-2"
          >
            <Form.Item name="rating" label="Your Rating" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>

            <Form.Item
              name="title"
              label="Headline / Title"
              rules={[{ required: true, message: 'Please provide a review headline' }]}
            >
              <Input placeholder="e.g. Incredibly soft leather, fits true to size" />
            </Form.Item>

            <Form.Item
              name="comment"
              label="Detailed Impression"
              rules={[{ required: true, min: 5, message: 'Please share at least a few words' }]}
            >
              <Input.TextArea rows={4} placeholder="Tell future buyers about comfort, materials, fit..." />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setReviewModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={reviewMutation.isPending}
                className="bg-slate-900 text-white"
              >
                Submit Review
              </Button>
            </div>
          </Form>
        </Modal>
      </section>

      {/* Related Sneakers Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                More Like This
              </span>
              <h3 className="text-2xl font-black text-slate-950 font-display uppercase">
                You May Also Admire
              </h3>
            </div>
            <Link
              to={`/catalog?category=${product.category.slug}`}
              className="text-xs font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1"
            >
              <span>Explore category</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
