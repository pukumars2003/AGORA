import React, { useState } from 'react';
import { X, Star, ThumbsUp, Heart, CheckCircle2, MessageSquare } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose, doctor, onFeedbackSubmitted }) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Doctor was patient', 'Affordable generic medicines']);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const availableTags = [
    'Doctor was patient',
    'Accurate diagnosis',
    'Zero clinic wait time',
    'Affordable generic medicines',
    'Fluent in native language',
    'Caring staff'
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/feedback/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: 'groq',
          rating: rating,
          latency_ms: 180.0,
          success: true
        })
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        if (onFeedbackSubmitted) onFeedbackSubmitted({ rating, selectedTags, comment });
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Feedback submission error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="font-extrabold text-base text-slate-900">
              Consultation Feedback & Rating
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-slate-800 text-base">Thank you for your feedback!</h4>
            <p className="text-xs text-slate-500">
              Your rating has been recorded and updated into our Online Reinforcement Learning Bandit.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
            
            {/* Doctor info */}
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
              <img
                src={doctor?.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
                alt="Doctor"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{doctor?.doctor_name || doctor?.name || 'Dr. Ramesh Kumar'}</h4>
                <p className="text-[11px] text-brand-700 font-semibold">{doctor?.speciality || 'General Physician'}</p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="text-center py-2">
              <span className="text-xs font-bold text-slate-600 block mb-2">How was your overall experience?</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition hover:scale-125"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Positive Tags */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 block mb-2">What did you like most?</span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="font-bold text-slate-600 block mb-1">Additional feedback / comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience to help other patients in Bharat..."
                rows={2}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
            >
              Submit Feedback (Updates RL Bandit)
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
