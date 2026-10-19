'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { uploadImage } from '@/lib/uploadImage';
import { Input, Select, FileInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'supporter', photo: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      let photoUrl = form.photo;
      if (photoFile) {
        try { photoUrl = await uploadImage(photoFile); }
        catch { toast.error('Image upload failed, using URL field instead'); }
      }
      const res = await api.post('/api/auth/register', { ...form, photo: photoUrl });
      login(res.data.token);
      toast.success('Welcome to FundFlow!');
      router.push('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      // Server returns { error, details? } for validation, or a plain-text body for 429.
      const detail = Array.isArray(data?.details) ? data.details[0] : null;
      let msg = data?.error || detail || (typeof data === 'string' ? data : null);
      if (!msg && status === 429) msg = 'Too many attempts. Please wait a few minutes and try again.';
      msg = msg || 'Registration failed';

      // Route field-specific validation back to the matching input.
      if (/password/i.test(msg)) {
        setErrors({ password: 'Password must be at least 8 characters' });
      } else if (/email/i.test(msg)) {
        setErrors({ email: 'This email is already registered' });
      } else if (/name/i.test(msg)) {
        setErrors({ name: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-light to-primary-light px-4">
      <div className="bg-surface rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Create account</h1>
        <p className="text-sm text-neutral-500 mb-6">Join FundFlow and start making an impact</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            autoComplete="name"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Doe"
            error={errors.name}
          />

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="jane@example.com"
            error={errors.email}
          />

          <FileInput
            label="Profile photo (optional)"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          <Input
            type="url"
            label="Or paste an image URL"
            value={form.photo}
            onChange={e => setForm({ ...form, photo: e.target.value })}
            placeholder="https://example.com/photo.jpg"
          />

          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 8 characters"
            error={errors.password}
          />

          <Select
            label="I want to"
            required
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'supporter', label: 'Support campaigns (Supporter)' },
              { value: 'creator', label: 'Launch campaigns (Creator)' },
            ]}
          />

          <Button type="submit" width="full" loading={loading} loadingText="Creating account…">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
