'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';
import { Product, ProductVariant, ProductCategory, ProductStatus, validateProductPublishability } from '@/lib/catalog-types';

interface AdminDashboardClientProps {
  initialProducts: Product[];
  username?: string;
}

export default function AdminDashboardClient({ initialProducts, username }: AdminDashboardClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newMeasurementInput, setNewMeasurementInput] = useState('');

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionText: 'Confirm',
    onConfirm: () => {},
  });

  // Re-fetch products from server
  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to refresh catalog:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Counts
  const totalCount = products.length;
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const archivedCount = products.filter((p) => p.status === 'archived').length;

  // Open Editor for New Product
  const handleCreateNew = () => {
    setEditingProduct({
      name: '',
      slug: '',
      description: '',
      price: 0,
      currency: 'INR',
      category: 'bottomwear',
      status: 'draft',
      isDemoPrice: false,
      fulfilment: 'made_to_order',
      isMadeToOrder: true,
      productionTime: '',
      careInstructions: '',
      measurements: [],
      images: ['/garment_1.jpg'],
      variants: [
        {
          name: 'Classic Standard',
          hex: '#111111',
          image: '/garment_1.jpg',
          sizes: [
            { size: 'S', available: true, stock: 10 },
            { size: 'M', available: true, stock: 15 },
            { size: 'L', available: true, stock: 10 },
          ],
        },
      ],
    });
    setNewMeasurementInput('');
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Product
  const handleEdit = (product: Product) => {
    const copy = JSON.parse(JSON.stringify(product));
    if (!copy.measurements) copy.measurements = [];
    setEditingProduct(copy);
    setNewMeasurementInput('');
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Upload Image Handler
  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      return data.url;
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
      return null;
    }
  };

  const handleProductImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setIsUploading(true);
    const url = await handleFileUpload(file);
    setIsUploading(false);
    if (url) {
      const currentImages = editingProduct.images || [];
      setEditingProduct({
        ...editingProduct,
        images: [...currentImages, url],
      });
      showToast('Image uploaded successfully');
    }
    e.target.value = '';
  };

  const handleVariantImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct || uploadingVariantIndex === null) return;
    setIsUploading(true);
    const url = await handleFileUpload(file);
    setIsUploading(false);
    if (url && editingProduct.variants) {
      const updated = [...editingProduct.variants];
      updated[uploadingVariantIndex].image = url;
      setEditingProduct({
        ...editingProduct,
        variants: updated,
      });
      showToast('Variant image updated');
    }
    setUploadingVariantIndex(null);
    e.target.value = '';
  };

  // Image manipulation in editor
  const handleRemoveImage = (index: number) => {
    if (!editingProduct || !editingProduct.images) return;
    const newImages = [...editingProduct.images];
    newImages.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (!editingProduct || !editingProduct.images) return;
    const newImages = [...editingProduct.images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  // Variant manipulation
  const handleAddVariant = () => {
    if (!editingProduct) return;
    const currentVariants = editingProduct.variants || [];
    const newVariant: ProductVariant = {
      name: `Variant ${currentVariants.length + 1}`,
      hex: '#222222',
      image: editingProduct.images?.[0] || '/garment_1.jpg',
      sizes: [
        { size: 'S', available: true, stock: 5 },
        { size: 'M', available: true, stock: 10 },
        { size: 'L', available: true, stock: 5 },
      ],
    };
    setEditingProduct({
      ...editingProduct,
      variants: [...currentVariants, newVariant],
    });
  };

  const handleRemoveVariant = (vIndex: number) => {
    if (!editingProduct || !editingProduct.variants) return;
    if (editingProduct.variants.length <= 1) {
      showToast('A product must have at least one variant.', 'error');
      return;
    }
    const newVariants = [...editingProduct.variants];
    newVariants.splice(vIndex, 1);
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  const handleAddSize = (vIndex: number) => {
    if (!editingProduct || !editingProduct.variants) return;
    const newVariants = [...editingProduct.variants];
    const currentSizes = newVariants[vIndex].sizes || [];
    newVariants[vIndex].sizes = [
      ...currentSizes,
      { size: 'XL', available: true, stock: 5 },
    ];
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  const handleRemoveSize = (vIndex: number, sIndex: number) => {
    if (!editingProduct || !editingProduct.variants) return;
    const newVariants = [...editingProduct.variants];
    const currentSizes = [...newVariants[vIndex].sizes];
    if (currentSizes.length <= 1) {
      showToast('A variant must have at least one size specification.', 'error');
      return;
    }
    currentSizes.splice(sIndex, 1);
    newVariants[vIndex].sizes = currentSizes;
    setEditingProduct({ ...editingProduct, variants: newVariants });
  };

  // Measurements Manipulation
  const handleAddMeasurement = (name?: string) => {
    if (!editingProduct) return;
    const toAdd = (name || newMeasurementInput).trim();
    if (!toAdd) return;
    const current = editingProduct.measurements || [];
    if (current.includes(toAdd)) {
      showToast(`Measurement "${toAdd}" is already in the list.`, 'error');
      return;
    }
    setEditingProduct({
      ...editingProduct,
      measurements: [...current, toAdd],
    });
    if (!name) setNewMeasurementInput('');
  };

  const handleRemoveMeasurement = (index: number) => {
    if (!editingProduct || !editingProduct.measurements) return;
    const updated = [...editingProduct.measurements];
    updated.splice(index, 1);
    setEditingProduct({
      ...editingProduct,
      measurements: updated,
    });
  };

  // Save product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name || !editingProduct.name.trim()) {
      setEditorError('Product name is required.');
      return;
    }

    if (editingProduct.price === undefined || isNaN(Number(editingProduct.price)) || Number(editingProduct.price) < 0) {
      setEditorError('Valid positive price is required.');
      return;
    }

    if (!editingProduct.category) {
      setEditorError('Category is required.');
      return;
    }

    // Publication check: block publishing incomplete products while allowing drafts
    if (editingProduct.status === 'published') {
      const check = validateProductPublishability(editingProduct);
      if (!check.canPublish) {
        setEditorError(
          `Publication blocked: Missing required selling information (${check.missingFields.join(', ')}). Incomplete garments can only be saved as Drafts until all details are provided.`
        );
        return;
      }
    }

    setIsSaving(true);
    setEditorError(null);

    try {
      const isExisting = Boolean(editingProduct.id);
      const endpoint = isExisting
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = isExisting ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      showToast(isExisting ? 'Product updated successfully' : 'Product created successfully');
      setIsEditorOpen(false);
      setEditingProduct(null);
      await refreshProducts();
    } catch (err: any) {
      setEditorError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Archive action
  const handleArchive = (product: Product) => {
    const isCurrentlyArchived = product.status === 'archived';
    const nextStatus: ProductStatus = isCurrentlyArchived ? 'published' : 'archived';
    const actionLabel = isCurrentlyArchived ? 'Unarchive and Publish' : 'Archive Product';

    if (nextStatus === 'published') {
      const check = validateProductPublishability(product);
      if (!check.canPublish) {
        showToast(
          `Cannot publish "${product.name}": required selling information is incomplete (${check.missingFields.join(', ')}).`,
          'error'
        );
        return;
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: `${actionLabel}: ${product.name}`,
      message: isCurrentlyArchived
        ? `Are you sure you want to restore "${product.name}" to published status? It will appear on the live storefront.`
        : `Are you sure you want to archive "${product.name}"? It will be safely hidden from the storefront catalog and search while preserving all data.`,
      actionText: actionLabel,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Action failed');
          showToast(`Product ${nextStatus === 'archived' ? 'archived' : 'published'} successfully.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await refreshProducts();
        } catch (err: any) {
          showToast(err.message || 'Failed to update status', 'error');
        }
      },
    });
  };

  // Permanent Delete action
  const handleDelete = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: `Permanently Delete: ${product.name}`,
      message: `WARNING: This will permanently delete "${product.name}" (${product.id}) from the catalog. This action is irreversible.`,
      actionText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/products/${product.id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to delete product');
          showToast(`"${product.name}" has been permanently deleted.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await refreshProducts();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete product', 'error');
        }
      },
    });
  };

  return (
    <div className={styles.adminContainer}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <h1 className={styles.brandTitle}>DOWNFALL ATELIER</h1>
          <span className={styles.badgeAdmin}>Client Admin</span>
        </div>
        <div className={styles.userGroup}>
          <span className={styles.userLabel}>Logged in as {username || 'Client'}</span>
          <Link href="/" target="_blank" className={styles.viewSiteLink}>
            View Storefront ↗
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Header & Stats */}
        <div className={styles.dashHeader}>
          <div>
            <h2 className={styles.dashTitle}>Catalog Management</h2>
            <p className={styles.dashSubtitle}>
              Control active storefront products, collections, prices, variants, inventory, and photography.
            </p>
          </div>
          <button onClick={handleCreateNew} className={styles.primaryActionBtn}>
            <span>+</span> Add New Garment
          </button>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Garments</div>
            <div className={styles.statValue}>{totalCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Published (Live)</div>
            <div className={styles.statValue} style={{ color: '#1b6324' }}>
              {publishedCount}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Drafts (Hidden)</div>
            <div className={styles.statValue} style={{ color: '#b36b00' }}>
              {draftCount}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Archived</div>
            <div className={styles.statValue} style={{ color: '#777' }}>
              {archivedCount}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by name, slug, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterSelectWrapper}>
              <span className={styles.filterLabel}>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Categories</option>
                <option value="basics">Basics</option>
                <option value="formal">Formal</option>
                <option value="luxury">Luxury</option>
                <option value="bottomwear">Bottomwear</option>
              </select>
            </div>

            <div className={styles.filterSelectWrapper}>
              <span className={styles.filterLabel}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className={styles.tableCard}>
          <table className={styles.productsTable}>
            <thead>
              <tr>
                <th>Garment</th>
                <th>Category</th>
                <th>Status</th>
                <th>Price</th>
                <th>Variants / Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    No garments found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImage = p.variants[0]?.image || p.images?.[0] || '/garment_1.jpg';
                  const totalStock = p.variants.reduce((acc, v) => {
                    return acc + v.sizes.reduce((sAcc, s) => sAcc + (s.stock ?? (s.available ? 1 : 0)), 0);
                  }, 0);

                  const statusClass =
                    p.status === 'published'
                      ? styles.statusPublished
                      : p.status === 'draft'
                      ? styles.statusDraft
                      : styles.statusArchived;

                  const categoryClass =
                    p.category === 'basics'
                      ? styles.badgeBasics
                      : p.category === 'formal'
                      ? styles.badgeFormal
                      : p.category === 'luxury'
                      ? styles.badgeLuxury
                      : styles.badgeBottomwear;

                  const isMTO = p.fulfilment ? p.fulfilment === 'made_to_order' : Boolean(p.isMadeToOrder);
                  const isINR = (p.currency || '').toUpperCase() === 'INR';
                  const formattedPrice = isINR
                    ? `₹${Number(p.price).toLocaleString('en-IN')}`
                    : `$${Number(p.price).toFixed(2)}`;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.productRowInfo}>
                          <div className={styles.rowThumbnail}>
                            <Image
                              src={primaryImage}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className={styles.rowThumbImg}
                            />
                          </div>
                          <div>
                            <div className={styles.rowName}>{p.name}</div>
                            <div className={styles.rowSlug}>/{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badgeCategory} ${categoryClass}`}>
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          ● {p.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{formattedPrice}</span>
                        {p.isDemoPrice && <span className={styles.demoPriceTag}>(Demo)</span>}
                      </td>
                      <td>
                        {isMTO ? (
                          <div>
                            <div>{p.variants?.length ? `${p.variants.length} colour(s)` : 'Bespoke'}</div>
                            <div style={{ fontSize: '12px', color: '#8b5e34', fontWeight: 700 }}>
                              Made to Order
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div>{p.variants.length} colour(s)</div>
                            <div style={{ fontSize: '12px', color: '#777', fontWeight: 400 }}>
                              {totalStock} units available
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <a
                            href={`/products/${p.slug}?preview=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.previewBtn}
                            title="Preview Garment"
                          >
                            Preview
                          </a>
                          <button
                            onClick={() => handleEdit(p)}
                            className={styles.editBtn}
                            title="Edit Garment"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchive(p)}
                            className={styles.archiveBtn}
                            title={p.status === 'archived' ? 'Publish garment' : 'Archive garment'}
                          >
                            {p.status === 'archived' ? 'Publish' : 'Archive'}
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className={styles.deleteBtn}
                            title="Permanently Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Editor Modal */}
      {isEditorOpen && editingProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWindow}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingProduct.id ? `Edit: ${editingProduct.name}` : 'New Garment Creation'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className={styles.closeModalBtn}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className={styles.modalBody}>
                {editorError && (
                  <div className={styles.loginError} role="alert">
                    {editorError}
                  </div>
                )}

                {/* Core Attributes */}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Garment Name *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="e.g. MONOCHROME BOMBER"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>URL Slug</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingProduct.slug || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                      placeholder="Leave blank to auto-generate from name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category *</label>
                    <select
                      className={styles.formSelect}
                      value={editingProduct.category || 'basics'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category: e.target.value as ProductCategory,
                        })
                      }
                    >
                      <option value="basics">Basics</option>
                      <option value="formal">Formal</option>
                      <option value="luxury">Luxury</option>
                      <option value="bottomwear">Bottomwear</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Fulfilment *</label>
                    <select
                      className={styles.formSelect}
                      value={editingProduct.fulfilment || (editingProduct.isMadeToOrder ? 'made_to_order' : 'stocked')}
                      onChange={(e) => {
                        const val = e.target.value as 'stocked' | 'made_to_order';
                        setEditingProduct({
                          ...editingProduct,
                          fulfilment: val,
                          isMadeToOrder: val === 'made_to_order',
                        });
                      }}
                    >
                      <option value="stocked">Stocked (Standard stock counts)</option>
                      <option value="made_to_order">Made to Order (Bespoke sizing, no stock inventory)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status *</label>
                    <select
                      className={styles.formSelect}
                      value={editingProduct.status || 'published'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          status: e.target.value as ProductStatus,
                        })
                      }
                    >
                      <option value="published">Published (Visible on storefront)</option>
                      <option value="draft">Draft (Hidden in progress)</option>
                      <option value="archived">Archived (Stored/Inactive)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Currency *</label>
                    <select
                      className={styles.formSelect}
                      value={editingProduct.currency || 'INR'}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, currency: e.target.value })
                      }
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      className={styles.formInput}
                      value={editingProduct.price ?? 0}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Production Lead Time (Made to Order)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingProduct.productionTime || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, productionTime: e.target.value })
                      }
                      placeholder="e.g. 7-10 business days"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Care Instructions (Made to Order)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editingProduct.careInstructions || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, careInstructions: e.target.value })
                      }
                      placeholder="e.g. Hand wash cold, dry flat"
                    />
                  </div>

                  <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        checked={Boolean(editingProduct.isDemoPrice)}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, isDemoPrice: e.target.checked })
                        }
                      />
                      <span className={styles.formLabel} style={{ margin: 0 }}>
                        Mark as Demo Price (Displays '(Demo)' indicator)
                      </span>
                    </label>
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullCol}`}>
                    <label className={styles.formLabel}>Atelier Description</label>
                    <textarea
                      className={styles.formTextarea}
                      value={editingProduct.description || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, description: e.target.value })
                      }
                      placeholder="Crafted with bespoke proportions, fine drapery, and artisanal finishing..."
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullCol}`}>
                    <label className={styles.formLabel}>Atelier Reference Notes (Internal Specifications & Sizing Notes)</label>
                    <textarea
                      className={styles.formTextarea}
                      value={editingProduct.referenceNote || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, referenceNote: e.target.value })
                      }
                      placeholder="Internal atelier reference specifications, sizing guidance, or measurement notes..."
                    />
                  </div>
                </div>

                {/* Required Client Measurements Manager */}
                <div className={styles.measurementsSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div className={styles.sectionHeading} style={{ margin: 0 }}>
                        Required Client Measurements (Bespoke Sizing)
                      </div>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: 400 }}>
                        Specify the body measurements required from the client when commissioning this garment.
                      </span>
                    </div>
                  </div>

                  <div className={styles.measurementTagList}>
                    {(editingProduct.measurements || []).length === 0 ? (
                      <span style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', fontWeight: 400 }}>
                        No required measurements added yet. Use quick presets below or add custom measurements.
                      </span>
                    ) : (
                      (editingProduct.measurements || []).map((m, idx) => (
                        <div key={`${m}-${idx}`} className={styles.measurementTag}>
                          <span>{m}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMeasurement(idx)}
                            className={styles.removeTagBtn}
                            title={`Remove ${m}`}
                            aria-label={`Remove ${m}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      style={{ maxWidth: '280px', padding: '6px 12px', fontSize: '13px' }}
                      value={newMeasurementInput}
                      onChange={(e) => setNewMeasurementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMeasurement();
                        }
                      }}
                      placeholder="e.g. Inseam, Waist, Chest"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMeasurement()}
                      className={styles.uploadLabelBtn}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      + Add Measurement
                    </button>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777', fontWeight: 700 }}>
                      Quick Presets:
                    </span>
                    <div className={styles.measurementPresets}>
                      {['Chest / Bust', 'Waist', 'Hips', 'Shoulder Width', 'Inseam', 'Garment Length', 'Height'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddMeasurement(preset)}
                          className={styles.presetBtn}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Imagery Manager */}
                <div className={styles.imageSection}>
                  <div className={styles.sectionHeading}>Garment Gallery & Photography</div>
                  <div className={styles.uploadRow}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProductImageSelect}
                      accept="image/*"
                      className={styles.fileInputHidden}
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.uploadLabelBtn}
                    >
                      {isUploading ? 'Uploading Image...' : '+ Upload New Photo'}
                    </button>
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: 400 }}>
                      JPG, PNG, WEBP allowed. Reorder or remove using thumbnail controls.
                    </span>
                  </div>

                  <div className={styles.imageList}>
                    {(editingProduct.images || []).map((imgUrl, idx) => (
                      <div key={`${imgUrl}-${idx}`} className={styles.imagePreviewBox}>
                        <div className={styles.previewThumb}>
                          <Image
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            fill
                            sizes="90px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div className={styles.previewActions}>
                          <button
                            type="button"
                            title="Move Left"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, 'left')}
                            className={styles.previewMiniBtn}
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            title="Remove"
                            onClick={() => handleRemoveImage(idx)}
                            className={styles.previewMiniBtn}
                            style={{ color: '#d10f18' }}
                          >
                            ✕
                          </button>
                          <button
                            type="button"
                            title="Move Right"
                            disabled={idx === (editingProduct.images?.length || 0) - 1}
                            onClick={() => handleMoveImage(idx, 'right')}
                            className={styles.previewMiniBtn}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variants Manager */}
                <div className={styles.variantsSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div className={styles.sectionHeading} style={{ margin: 0 }}>
                      Colour Variants & Stock Inventory
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className={styles.uploadLabelBtn}
                    >
                      + Add Colour Variant
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={variantFileInputRef}
                    onChange={handleVariantImageSelect}
                    accept="image/*"
                    className={styles.fileInputHidden}
                  />

                  {(editingProduct.variants || []).map((variant, vIdx) => (
                    <div key={`variant-${vIdx}`} className={styles.variantCard}>
                      <div className={styles.variantCardHeader}>
                        <div className={styles.variantCardTitle}>
                          Variant #{vIdx + 1}: {variant.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(vIdx)}
                          className={styles.removeVariantBtn}
                        >
                          Remove Variant
                        </button>
                      </div>

                      <div className={styles.variantFieldsGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Colour Name</label>
                          <input
                            type="text"
                            required
                            className={styles.formInput}
                            value={variant.name}
                            onChange={(e) => {
                              const updated = [...(editingProduct.variants || [])];
                              updated[vIdx].name = e.target.value;
                              setEditingProduct({ ...editingProduct, variants: updated });
                            }}
                            placeholder="e.g. Charcoal"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Colour Swatch</label>
                          <div className={styles.colorPickerWrap}>
                            <input
                              type="color"
                              className={styles.colorPickerInput}
                              value={variant.hex.startsWith('#') ? variant.hex : '#111111'}
                              onChange={(e) => {
                                const updated = [...(editingProduct.variants || [])];
                                updated[vIdx].hex = e.target.value;
                                setEditingProduct({ ...editingProduct, variants: updated });
                              }}
                            />
                            <input
                              type="text"
                              className={styles.formInput}
                              style={{ width: '85px', padding: '6px' }}
                              value={variant.hex}
                              onChange={(e) => {
                                const updated = [...(editingProduct.variants || [])];
                                updated[vIdx].hex = e.target.value;
                                setEditingProduct({ ...editingProduct, variants: updated });
                              }}
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Variant Image</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '46px',
                                position: 'relative',
                                background: '#eee',
                                border: '1px solid #ccc',
                              }}
                            >
                              {variant.image && (
                                <Image
                                  src={variant.image}
                                  alt={variant.name}
                                  fill
                                  sizes="38px"
                                  style={{ objectFit: 'cover' }}
                                />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadingVariantIndex(vIdx);
                                variantFileInputRef.current?.click();
                              }}
                              className={styles.uploadLabelBtn}
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              Upload
                            </button>
                            <input
                              type="text"
                              className={styles.formInput}
                              style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                              value={variant.image}
                              onChange={(e) => {
                                const updated = [...(editingProduct.variants || [])];
                                updated[vIdx].image = e.target.value;
                                setEditingProduct({ ...editingProduct, variants: updated });
                              }}
                              placeholder="Image URL"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sizes for Variant */}
                      <div className={styles.sizesListWrap}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={styles.formLabel}>
                            {(editingProduct.fulfilment === 'made_to_order' || editingProduct.isMadeToOrder)
                              ? 'Sizing & Specifications (Made to Order — Bespoke Client Measurements)'
                              : 'Sizes & Stock Quantities'}
                          </span>
                          {!(editingProduct.fulfilment === 'made_to_order' || editingProduct.isMadeToOrder) && (
                            <button
                              type="button"
                              onClick={() => handleAddSize(vIdx)}
                              className={styles.uploadLabelBtn}
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              + Add Size
                            </button>
                          )}
                        </div>

                        {(editingProduct.fulfilment === 'made_to_order' || editingProduct.isMadeToOrder) ? (
                          <div style={{ padding: '10px 14px', background: '#fcf8f2', border: '1px solid #ebd9c8', borderRadius: '4px', fontSize: '12px', color: '#8b5e34', fontWeight: 700, margin: '8px 0' }}>
                            Made to Order: Sizing is commissioned on demand according to bespoke client measurements. No artificial stock inventory counts are tracked.
                          </div>
                        ) : (
                          variant.sizes.map((s, sIdx) => (
                            <div key={`size-${vIdx}-${sIdx}`} className={styles.sizeRow}>
                              <input
                                type="text"
                                className={styles.sizeInput}
                                value={s.size}
                                onChange={(e) => {
                                  const updated = [...(editingProduct.variants || [])];
                                  updated[vIdx].sizes[sIdx].size = e.target.value;
                                  setEditingProduct({ ...editingProduct, variants: updated });
                                }}
                                placeholder="Size"
                              />

                              <label className={styles.checkboxRow} style={{ minWidth: '110px' }}>
                                <input
                                  type="checkbox"
                                  className={styles.checkboxInput}
                                  checked={s.available}
                                  onChange={(e) => {
                                    const updated = [...(editingProduct.variants || [])];
                                    updated[vIdx].sizes[sIdx].available = e.target.checked;
                                    setEditingProduct({ ...editingProduct, variants: updated });
                                  }}
                                />
                                <span style={{ fontSize: '12px', fontWeight: 700 }}>Available</span>
                              </label>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#666', fontWeight: 700 }}>
                                  Stock:
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  className={styles.stockInput}
                                  value={s.stock ?? 0}
                                  onChange={(e) => {
                                    const updated = [...(editingProduct.variants || [])];
                                    updated[vIdx].sizes[sIdx].stock = Number(e.target.value);
                                    setEditingProduct({ ...editingProduct, variants: updated });
                                  }}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveSize(vIdx, sIdx)}
                                className={styles.previewMiniBtn}
                                style={{ color: '#d10f18', marginLeft: 'auto' }}
                                title="Remove size"
                              >
                                Remove Size
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditorOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={styles.saveBtn}
                >
                  {isSaving ? 'Saving Changes...' : editingProduct.id ? 'Save Updates' : 'Create Garment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmBox}>
            <h3 className={styles.confirmTitle}>{confirmDialog.title}</h3>
            <p className={styles.confirmText}>{confirmDialog.message}</p>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={styles.saveBtn}
                style={{ backgroundColor: '#d10f18', borderColor: '#d10f18' }}
              >
                {confirmDialog.actionText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`${styles.toastNotice} ${
            toast.type === 'error' ? styles.toastError : ''
          }`}
          role="status"
        >
          <span>{toast.type === 'error' ? '⚠' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
