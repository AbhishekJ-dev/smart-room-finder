import React, { useState, useEffect } from 'react';
import { CalendarCheck, ChevronRight, Clock, CheckCircle2, XCircle, IndianRupee } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/admin/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      pending:   { cls: 'badge-amber', icon: <Clock size={11} /> },
      confirmed: { cls: 'badge-green', icon: <CheckCircle2 size={11} /> },
      cancelled: { cls: 'badge-red',   icon: <XCircle size={11} /> },
      completed: { cls: 'badge-blue',  icon: <CheckCircle2 size={11} /> },
    };
    const s = config[status] || config.pending;
    return (
      <span className={`badge ${s.cls} text-[11px] gap-1`}>
        {s.icon} {status}
      </span>
    );
  };

  return (
    <AdminLayout title="Booking Management" subtitle="Oversee platform transactions and approval flows.">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Tenant → Owner</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Property</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Amount</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan="5" className="px-6 py-4">
                      <div className="skeleton h-4 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-[#94A3B8] text-sm font-medium">No bookings found</td>
                </tr>
              ) : bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-[#F8FAFC] transition-colors group">
                  {/* Tenant → Owner */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1E293B] truncate max-w-[120px]">{booking.user_name}</span>
                      <ChevronRight size={13} className="text-[#CBD5E1] shrink-0" />
                      <span className="text-sm text-[#64748B] font-medium truncate max-w-[120px]">{booking.owner_name}</span>
                    </div>
                    {booking.duration && (
                      <p className="text-xs text-[#94A3B8] mt-0.5">{booking.duration}</p>
                    )}
                  </td>

                  {/* Property */}
                  <td className="px-6 py-4">
                    <div
                      className="flex items-center gap-2 cursor-pointer group/link"
                      onClick={() => navigate('/admin/properties')}
                    >
                      <div className="w-8 h-8 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-[#2563EB] shrink-0">
                        <CalendarCheck size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1E293B] group-hover/link:text-[#2563EB] transition-colors truncate max-w-[140px]">
                          {booking.property_area}
                        </p>
                        <p className="text-xs text-[#94A3B8]">{booking.property_type}</p>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm font-semibold text-[#1E293B]">
                      <IndianRupee size={13} className="text-[#2563EB]" />
                      {booking.total_price?.toLocaleString()}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={booking.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                            className="px-3 py-1.5 bg-[#F0FDF4] text-[#16A34A] text-xs font-semibold rounded-lg hover:bg-[#BBF7D0] border border-[#BBF7D0] transition-all cursor-pointer whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            className="px-3 py-1.5 bg-[#FFF1F2] text-[#DC2626] text-xs font-semibold rounded-lg hover:bg-[#FECDD3] border border-[#FECDD3] transition-all cursor-pointer whitespace-nowrap"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(booking.id, 'completed')}
                          className="px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold rounded-lg hover:bg-[#BFDBFE] border border-[#BFDBFE] transition-all cursor-pointer whitespace-nowrap"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
