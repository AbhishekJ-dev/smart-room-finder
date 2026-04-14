import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, Camera, Eye } from 'lucide-react';

const TENANT_BADGE = {
  Boys:   { label: 'Boys Only', color: 'badge-blue' },
  Girls:  { label: 'Girls Only', color: 'badge-purple' },
  Anyone: { label: 'For Everyone', color: 'badge-green' },
};

export function RoomCard({ room, onClick, actionLabel = 'View Details', delay = 0 }) {
  let photos = [];
  try {
    photos = typeof room.photos === 'string' ? JSON.parse(room.photos) : (room.photos || []);
    photos = photos.filter(Boolean);
  } catch { photos = []; }

  const imgSrc = photos.length > 0
    ? `http://localhost:5000${photos[0]}`
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600';

  const badge = TENANT_BADGE[room.tenant_type] || TENANT_BADGE['Anyone'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden cursor-pointer group shadow-soft hover:shadow-card-hover hover:border-[#BFDBFE] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-[#F1F5F9]">
        <img
          src={imgSrc}
          alt={room.area || 'Room'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="badge badge-blue text-[11px]">{room.type}</span>
        </div>

        {/* Booked badge */}
        {room.is_booked && (
          <div className="absolute top-3 right-3">
            <span className="badge badge-red text-[11px]">Booked</span>
          </div>
        )}

        {/* Photo count */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-medium">
            <Camera size={11} />
            {photos.length} photos
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={e => e.stopPropagation()}
          className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] hover:bg-white transition-all shadow-soft"
        >
          <Heart size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[#1E293B] text-[15px] leading-snug flex-1 min-w-0 truncate">
            {room.area}
          </h3>
          <div className="shrink-0 text-right">
            <p className="text-[#2563EB] font-bold text-base leading-tight">
              ₹{room.price_monthly?.toLocaleString()}
            </p>
            <p className="text-[#94A3B8] text-[10px] font-medium">/month</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
          <MapPin size={12} className="text-[#2563EB] shrink-0" />
          <span className="truncate">{room.location || 'Location not specified'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge ${badge.color} text-[10px]`}>{badge.label}</span>
        </div>

        {/* Action Button */}
        <button className="mt-1 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-[#2563EB]">
          <Eye size={14} />
          {actionLabel}
        </button>
      </div>
    </motion.div>
  );
}
