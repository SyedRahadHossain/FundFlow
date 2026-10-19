'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { uploadImage } from '@/lib/uploadImage';
import { Input, Textarea, Select, FileInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const CATEGORIES = ['Technology','Art & Design','Community','Health','Music','Education','Environment','Gaming','Other'];

export default function AddCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', story: '', category: 'Technology',
    funding_goal: '', minimum_contribution: '',
    deadline: '', reward_info: '', campaign_image_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())          e.title = 'Title required';
    if (!form.story.trim())          e.story = 'Story required';
    if (!form.funding_goal || form.funding_goal <= 0) e.funding_goal = 'Valid funding goal required';
    if (!form.minimum_contribution || form.minimum_contribution <= 0) e.minimum_contribution = 'Minimum contribution required';
    if (!form.deadline)              e.deadline = 'Deadline required';
    if (new Date(form.deadline) <= new Date()) e.deadline = 'Deadline must be in the future';
    if (!form.reward_info.trim())    e.reward_info = 'Reward info required';
    if (!form.campaign_image_url && !imageFile) e.campaign_image_url = 'Image required';
    return e;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors(er => ({ ...er, campaign_image_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      let imageUrl = form.campaign_image_url;
      if (imageFile) {
        try { imageUrl = await uploadImage(imageFile); }
        catch { toast.error('Image upload failed — using URL instead'); }
      }
      await api.post('/api/campaigns', {
        ...form,
        funding_goal: Number(form.funding_goal),
        minimum_contribution: Number(form.minimum_contribution),
        campaign_image_url: imageUrl,
      });
      toast.success('Campaign submitted for review!');
      router.push('/dashboard/my-campaigns');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Add New Campaign</h2>
        <p className="text-neutral-500 text-sm mt-1">Submit a campaign for Admin review before it goes live</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-neutral-100 p-6 space-y-5 shadow-sm">
        <Input
          label="Campaign Title"
          required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Give your campaign a compelling title"
          error={errors.title}
        />

        <Textarea
          label="Campaign Story"
          required
          rows={5}
          value={form.story}
          onChange={e => set('story', e.target.value)}
          placeholder="Tell supporters why this campaign matters and how funds will be used…"
          error={errors.story}
        />

        <Select
          label="Category"
          required
          value={form.category}
          onChange={e => set('category', e.target.value)}
          options={CATEGORIES.map(c => ({ value: c, label: c }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Funding Goal (credits)"
            required
            type="number"
            min={1}
            value={form.funding_goal}
            onChange={e => set('funding_goal', e.target.value)}
            placeholder="e.g. 1000"
            error={errors.funding_goal}
          />
          <Input
            label="Min Contribution (credits)"
            required
            type="number"
            min={1}
            value={form.minimum_contribution}
            onChange={e => set('minimum_contribution', e.target.value)}
            placeholder="e.g. 10"
            error={errors.minimum_contribution}
          />
        </div>

        <Input
          label="Deadline"
          required
          type="date"
          value={form.deadline}
          onChange={e => set('deadline', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          error={errors.deadline}
        />

        <Textarea
          label="Reward Info"
          required
          rows={3}
          value={form.reward_info}
          onChange={e => set('reward_info', e.target.value)}
          placeholder="What will supporters receive for backing your campaign?"
          error={errors.reward_info}
        />

        <div className="space-y-2">
          <FileInput
            label="Campaign Image"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Campaign image preview" className="h-32 w-full object-cover rounded-xl" />
          )}
          <Input
            type="url"
            label="Or paste an image URL"
            value={form.campaign_image_url}
            onChange={e => set('campaign_image_url', e.target.value)}
            placeholder="https://example.com/image.jpg"
            error={errors.campaign_image_url}
          />
        </div>

        <Button type="submit" width="full" size="lg" loading={submitting} loadingText="Submitting…">
          🚀 Submit Campaign for Review
        </Button>
      </form>
    </div>
  );
}
