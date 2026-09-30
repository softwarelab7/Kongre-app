// src/components/TableroAnunciosTab.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { CongregationNotice } from '../types';
import {
  Bell,
  Pin,
  Calendar,
  Share2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Award,
  Sparkles,
  MapPin,
  Brush,
  FileText,
  X,
  Send,
} from 'lucide-react';

export const TableroAnunciosTab: React.FC = () => {
  const { notices, addNotice, updateNotice, deleteNotice, settings } = useCongregation();

  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedNoticeId, setCopiedNoticeId] = useState<string | null>(null);

  // Modal create/edit notice
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<CongregationNotice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'anuncio' as CongregationNotice['category'],
    content: '',
    date: new Date().toISOString().split('T')[0],
    expiresDate: '',
    pinned: false,
    author: 'Cuerpo de Ancianos',
  });

  const filteredNotices = notices.filter((n) => {
    if (selectedCategory !== 'todos' && n.category !== selectedCategory) return false;
    return true;
  });

  // Sort pinned first, then by date descending
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.date.localeCompare(a.date);
  });

  const handleOpenNew = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      category: 'anuncio',
      content: '',
      date: new Date().toISOString().split('T')[0],
      expiresDate: '',
      pinned: false,
      author: 'Cuerpo de Ancianos',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice: CongregationNotice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      category: notice.category,
      content: notice.content,
      date: notice.date,
      expiresDate: notice.expiresDate || '',
      pinned: notice.pinned,
      author: notice.author || 'Cuerpo de Ancianos',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingNotice) {
      updateNotice({
        ...editingNotice,
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        date: formData.date,
        expiresDate: formData.expiresDate || undefined,
        pinned: formData.pinned,
        author: formData.author.trim() || undefined,
      });
    } else {
      addNotice({
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        date: formData.date,
        expiresDate: formData.expiresDate || undefined,
        pinned: formData.pinned,
        author: formData.author.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleCopyNotice = (notice: CongregationNotice) => {
    let msg = `*📢 ${notice.title.toUpperCase()}*\n`;
    msg += `Congregación: ${settings.congregationName}\n`;
    msg += `Fecha: ${notice.date}\n`;
    if (notice.author) msg += `Publicado por: ${notice.author}\n\n`;
    msg += `${notice.content}\n\n`;
    if (notice.expiresDate) msg += `_Válido hasta: ${notice.expiresDate}_\n`;

    navigator.clipboard.writeText(msg);
    setCopiedNoticeId(notice.id);
    setTimeout(() => setCopiedNoticeId(null), 2500);
  };

  const getCategoryBadge = (cat: CongregationNotice['category']) => {
    switch (cat) {
      case 'circuito':
        return { label: 'Visita del SC', bg: 'bg-purple-100 text-purple-800' };
      case 'asamblea':
        return { label: 'Asamblea', bg: 'bg-blue-100 text-blue-800' };
      case 'campana':
        return { label: 'Campaña Especial', bg: 'bg-amber-100 text-amber-800' };
      case 'limpieza':
        return { label: 'Aseo y Salón', bg: 'bg-emerald-100 text-emerald-800' };
      case 'carta':
        return { label: 'Carta Oficial', bg: 'bg-indigo-100 text-indigo-800' };
      default:
        return { label: 'Anuncio General', bg: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Tablero de Anuncios
            </span>
            <span className="text-xs text-slate-500 font-medium">Información Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tablero de la Congregación
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Publicación de cartas oficiales, próximas asambleas, visita del superintendente y avisos de servicio.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar Anuncio</span>
        </button>
      </div>

      {/* Categories Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'todos', label: 'Todos los anuncios' },
          { id: 'circuito', label: 'Visita del SC' },
          { id: 'asamblea', label: 'Asambleas' },
          { id: 'campana', label: 'Campañas' },
          { id: 'limpieza', label: 'Aseo y Salón' },
          { id: 'carta', label: 'Cartas' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Notices Grid */}
      {sortedNotices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            No hay anuncios publicados en esta categoría
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Presione &ldquo;Publicar Anuncio&rdquo; para redactar un aviso para la congregación.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedNotices.map((notice) => {
            const badge = getCategoryBadge(notice.category);

            return (
              <div
                key={notice.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  notice.pinned
                    ? 'border-indigo-300 ring-2 ring-indigo-100'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Notice Card Top */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                      {notice.pinned && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3 fill-indigo-600" />
                          Fijado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyNotice(notice)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Copiar texto para WhatsApp"
                      >
                        {copiedNoticeId === notice.id ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(notice)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar anuncio"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el anuncio "${notice.title}"?`)) {
                            deleteNotice(notice.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar anuncio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {notice.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                    {notice.content}
                  </p>
                </div>

                {/* Notice Footer info */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Publicado: {notice.date}</span>
                  </div>
                  {notice.author && (
                    <span className="font-semibold text-slate-600">Por: {notice.author}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT NOTICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>{editingNotice ? 'Editar Anuncio' : 'Nuevo Anuncio para el Tablero'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Anuncio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Visita del Superintendente de Circuito"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as CongregationNotice['category'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="anuncio">Anuncio General</option>
                    <option value="circuito">Visita del SC</option>
                    <option value="asamblea">Asamblea</option>
                    <option value="campana">Campaña Especial</option>
                    <option value="limpieza">Aseo y Salón</option>
                    <option value="carta">Carta Oficial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Publicado por</label>
                  <input
                    type="text"
                    placeholder="Ej. Cuerpo de Ancianos"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contenido del Anuncio
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escriba los detalles completos del comunicado..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vigencia hasta (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresDate}
                    onChange={(e) => setFormData({ ...formData, expiresDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Fijar este anuncio al inicio del tablero</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Guardar Anuncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
