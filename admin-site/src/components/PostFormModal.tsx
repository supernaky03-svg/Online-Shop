import { ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createPost, updatePost } from '../api';
import type { ContactDraft, ContactType, Post, PostImage } from '../types';
import { isContactUrlValid } from '../utils';

interface NewImageDraft {
  id: string;
  file: File;
  preview: string;
}

interface Props {
  post: Post | null;
  onClose: () => void;
  onSaved: (post: Post) => void;
}

const contactOptions: { label: string; value: ContactType }[] = [
  { label: 'Facebook Page', value: 'facebook' },
  { label: 'TikTok account', value: 'tiktok' },
  { label: 'Telegram account', value: 'telegram' },
  { label: 'Viber account', value: 'viber' },
];

export default function PostFormModal({ post, onClose, onSaved }: Props) {
  const [name, setName] = useState(post?.name || '');
  const [instock, setInstock] = useState(post?.instock || '');
  const [caption, setCaption] = useState(post?.caption || '');
  const [price, setPrice] = useState(post?.price ? String(post.price) : '');
  const [existingImages, setExistingImages] = useState<PostImage[]>(post?.images || []);
  const [newImages, setNewImages] = useState<NewImageDraft[]>([]);
  const [contacts, setContacts] = useState<ContactDraft[]>(post?.contacts?.map((c) => ({ contact_type: c.contact_type, contact_url: c.contact_url })) || []);
  const [submitting, setSubmitting] = useState(false);

  const totalImages = existingImages.length + newImages.length;
  const title = post ? 'Edit post' : 'Add post';

  const formValid = useMemo(() => {
    const priceNumber = Number(price);
    return Boolean(name.trim()) && priceNumber > 0 && totalImages >= 1 && totalImages <= 5;
  }, [name, price, totalImages]);

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const onlyImages = files.filter((file) => file.type.startsWith('image/'));
    if (onlyImages.length !== files.length) toast.error('Only image files are allowed.');
    const allowedSlots = 5 - totalImages;
    if (onlyImages.length > allowedSlots) toast.error('Maximum 5 images per post.');
    const selected = onlyImages.slice(0, Math.max(0, allowedSlots)).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((current) => [...current, ...selected]);
    event.target.value = '';
  }

  function removeNewImage(id: string) {
    setNewImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((image) => image.id !== id);
    });
  }

  function addContact() {
    setContacts((current) => [...current, { contact_type: 'facebook', contact_url: '' }]);
  }

  function updateContact(index: number, patch: Partial<ContactDraft>) {
    setContacts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function removeContact(index: number) {
    setContacts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function validate(): boolean {
    if (!name.trim()) return toast.error('Name is required.'), false;
    if (!Number(price) || Number(price) <= 0) return toast.error('Price must be greater than 0.'), false;
    if (totalImages < 1 || totalImages > 5) return toast.error('Images must be between 1 and 5.'), false;
    for (const contact of contacts) {
      if (!isContactUrlValid(contact.contact_type, contact.contact_url)) {
        toast.error(`Invalid ${contact.contact_type} link.`);
        return false;
      }
    }
    return true;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('price', String(Number(price)));
      formData.append('caption', caption.trim());
      formData.append('instock', instock.trim());
      formData.append('contacts', JSON.stringify(contacts.map((item) => ({ contact_type: item.contact_type, contact_url: item.contact_url.trim() }))));
      if (post) formData.append('keep_image_ids', JSON.stringify(existingImages.map((image) => image.id)));
      newImages.forEach((image) => formData.append('images', image.file));
      const saved = post ? await updatePost(post.id, formData) : await createPost(formData);
      toast.success(post ? 'Post updated.' : 'Post published.');
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop form-modal" role="dialog" aria-modal="true">
      <form className="post-form" onSubmit={submit}>
        <div className="modal-head">
          <div><h2>{title}</h2><p>Upload 1 to 5 images and fill product information.</p></div>
          <button type="button" className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        <section className="form-section">
          <div className="section-row"><h3>Images</h3><span>{totalImages}/5</span></div>
          <div className="image-editor-grid">
            {existingImages.map((image) => (
              <div className="editable-image" key={image.id}>
                <img src={image.image_url} alt="Existing product" />
                <button type="button" onClick={() => setExistingImages((current) => current.filter((item) => item.id !== image.id))}><Trash2 size={15} /></button>
              </div>
            ))}
            {newImages.map((image) => (
              <div className="editable-image" key={image.id}>
                <img src={image.preview} alt="New product preview" />
                <button type="button" onClick={() => removeNewImage(image.id)}><Trash2 size={15} /></button>
              </div>
            ))}
            {totalImages < 5 ? (
              <label className="upload-tile"><ImagePlus size={24} /><span>Add images</span><input type="file" accept="image/*" multiple onChange={addImages} /></label>
            ) : null}
          </div>
        </section>

        <section className="form-section two-cols">
          <label><span>Name *</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" /></label>
          <label><span>Price / Ks *</span><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="25000" /></label>
          <label><span>Instock optional</span><input value={instock} onChange={(e) => setInstock(e.target.value)} placeholder="In stock / 5 left" /></label>
          <label className="full"><span>Caption</span><textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} placeholder="Multiline product description" /></label>
        </section>

        <section className="form-section">
          <div className="section-row"><h3>Buy Contact</h3><button type="button" className="secondary tiny" onClick={addContact}><Plus size={15} /> Add</button></div>
          {contacts.length === 0 ? <p className="muted">No contacts yet. Add Facebook, TikTok, Telegram, or Viber.</p> : null}
          <div className="contact-box-list">
            {contacts.map((contact, index) => (
              <div className="contact-box" key={index}>
                <select value={contact.contact_type} onChange={(e) => updateContact(index, { contact_type: e.target.value as ContactType })}>
                  {contactOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input value={contact.contact_url} onChange={(e) => updateContact(index, { contact_url: e.target.value })} placeholder="https://..." />
                <button type="button" className="danger icon-only" onClick={() => removeContact(index)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>

        <div className="modal-actions sticky-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button disabled={submitting || !formValid} type="submit"><Save size={17} /> {submitting ? 'Saving...' : 'Save post'}</button>
        </div>
      </form>
    </div>
  );
}
