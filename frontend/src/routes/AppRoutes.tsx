import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { StorefrontLayout } from '../components/layout/StorefrontLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Storefront Pages
import { HomePage } from '../pages/storefront/HomePage';
import { CatalogPage } from '../pages/storefront/CatalogPage';
import { ProductDetailPage } from '../pages/storefront/ProductDetailPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { CheckoutPage } from '../pages/checkout/CheckoutPage';
import { OrderConfirmationPage } from '../pages/checkout/OrderConfirmationPage';
import { OrdersPage } from '../pages/account/OrdersPage';
import { ProfilePage } from '../pages/account/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage';
import { AdminCouponsPage } from '../pages/admin/AdminCouponsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="/account/orders" element={<OrdersPage />} />
        <Route path="/account/profile" element={<ProfilePage />} />

        {/* 404 Not Found */}
        <Route
          path="*"
          element={
            <div className="py-24 text-center space-y-4">
              <h2 className="text-4xl font-black text-slate-900 font-display">404</h2>
              <p className="text-sm text-slate-500">The page you requested could not be located.</p>
              <Link
                to="/"
                className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Back to STRIDE Home
              </Link>
            </div>
          }
        />
      </Route>

      {/* Admin Console Portal Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
      </Route>
    </Routes>
  );
};
