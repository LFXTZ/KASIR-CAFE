/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { Product } from '../../types/pos.ts';
import { formatRupiah } from '../../utils/formatters.ts';
import { Plus, Coffee, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 400);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer select-none ${
        isOutOfStock
          ? 'opacity-55 cursor-not-allowed bg-slate-900/60 border-slate-800'
          : 'bg-slate-800/90 dark:bg-slate-800/90 light:bg-white border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/20 active:scale-[0.985]'
      } ${justAdded ? 'ring-2 ring-emerald-500' : ''}`}
    >
      {/* Product Image Slot */}
      <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
        {!imageError && product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 p-4">
            <Coffee className="w-8 h-8 mb-1 opacity-40 text-emerald-400" />
            <span className="text-xs font-medium text-slate-400 text-center">{product.name}</span>
          </div>
        )}

        {/* Hover Quick Add Overlay Indicator */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-emerald-500 text-slate-950 p-2.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
              <Plus className="w-4 h-4 stroke-[3]" />
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 mb-1">
            <span className="font-mono tracking-wider">{product.sku}</span>
            {isOutOfStock ? (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Habis
              </span>
            ) : isLowStock ? (
              <span className="text-amber-400 font-medium">Sisa {product.stock}</span>
            ) : (
              <span>Stok: {product.stock}</span>
            )}
          </div>
          <h4 className="font-semibold text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 leading-snug line-clamp-2">
            {product.name}
          </h4>
        </div>

        {/* Price & Add Trigger */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 dark:border-slate-700/40 light:border-slate-100 mt-auto">
          <span className="font-mono-numbers text-base font-bold text-emerald-400 dark:text-emerald-400 light:text-emerald-600">
            {formatRupiah(product.price)}
          </span>
          <button
            type="button"
            disabled={isOutOfStock}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-600'
                : 'bg-slate-700/60 dark:bg-slate-700/60 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 group-hover:bg-emerald-500 group-hover:text-slate-950'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
