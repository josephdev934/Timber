"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, onUpdate }: EditProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || user?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset || "");
    
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      };
      
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let finalPhotoUrl = profilePhoto;
      
      if (selectedFile) {
        try {
          finalPhotoUrl = await uploadToCloudinary(selectedFile);
        } catch (uploadErr) {
          setError("Failed to upload image. Please try again.");
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem("timber_token");
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          name,
          bio,
          profilePhoto: finalPhotoUrl,
        }),
      });

      let data;
      const textRes = await res.text();
      try {
        data = JSON.parse(textRes);
      } catch (parseErr) {
        console.error("Non-JSON response from server:", textRes);
        throw new Error(`Server returned a non-JSON response (Status: ${res.status})`);
      }

      if (res.ok) {
        updateUser(data.user); // Sync global auth state
        onUpdate(data.user);
        onClose();
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-timber-border">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-timber-text">Edit Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-elevated rounded-full transition-colors">
              <svg className="w-6 h-6 text-timber-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950 text-red-600 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center mb-6">
                 <div className="relative group cursor-pointer" onClick={() => document.getElementById('profile-photo-picker')?.click()}>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-md bg-elevated relative">
                       <img 
                          src={selectedFile ? URL.createObjectURL(selectedFile) : (profilePhoto || "/default-avatar.svg")} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover"
                       />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                       </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-timber-brand text-white rounded-full border-4 border-surface flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                       </svg>
                    </div>
                 </div>
                 <input 
                    type="file" 
                    id="profile-photo-picker" 
                    accept="image/jpeg,image/png,image/webp,image/gif" 
                    className="hidden" 
                    onChange={handleFileChange}
                 />
                 <p className="text-[10px] text-timber-muted font-bold tracking-widest uppercase mt-4">Change Photo</p>
              </div>

              {/* Name (Read Only) */}
              <div>
                <label className="text-[10px] font-bold text-timber-muted tracking-widest uppercase mb-2 block ml-4">Real Name (Immutable)</label>
                <input 
                  type="text" 
                  value={name}
                  disabled
                  className="w-full bg-elevated border border-timber-border rounded-2xl px-5 py-3 text-sm text-timber-muted cursor-not-allowed opacity-60"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-[10px] font-bold text-timber-muted tracking-widest uppercase mb-2 block ml-4">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-timber-input-bg border border-timber-border rounded-2xl px-5 py-3 text-sm text-timber-text placeholder-timber-placeholder focus:outline-none focus:border-timber-brand transition-colors"
                  placeholder="username"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-[10px] font-bold text-timber-muted tracking-widest uppercase mb-2 block ml-4">Biography</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-timber-input-bg border border-timber-border rounded-2xl px-5 py-3 text-sm text-timber-text placeholder-timber-placeholder focus:outline-none focus:border-timber-brand transition-colors h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="text-[10px] font-bold text-timber-muted tracking-widest uppercase mb-2 block ml-4">Email (Private)</label>
                <input 
                  type="email" 
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-elevated border border-timber-border rounded-2xl px-5 py-3 text-sm text-timber-muted cursor-not-allowed opacity-60"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-timber-brand text-white font-bold py-4 rounded-2xl shadow-lg shadow-timber-brand/30 active:scale-95 transition-all hover:bg-timber-brand/90 disabled:opacity-50"
            >
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
