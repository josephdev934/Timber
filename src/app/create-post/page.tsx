"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/layout/BottomNav";

/**
 * ==========================================
 * PAGE: Create Post
 * ==========================================
 */
export default function CreatePostPage() {
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/register");
    }
  }, [user, authLoading, router]);

  // Clear upload error after 4s
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (video) {
      setUploadError("Cannot mix images and video.");
      return;
    }
    if (images.length + files.length > 4) {
      setUploadError("You can only add up to 4 images per post.");
      return;
    }
    
    const validFiles = files.filter(file => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setUploadError("Only jpg, png, webp, gif images are allowed.");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("This file exceeds the 10 MB limit.");
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length > 0) {
      setUploadError("Cannot mix images and video.");
      return;
    }
    if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) {
      setUploadError("Only mp4, mov, webm videos are allowed.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError("This file exceeds the 100 MB limit.");
      return;
    }
    setVideo(file);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (file: File, type: 'image' | 'video'): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset || "");
    
    try {
      const response = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
          }
        };
        
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
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0 && !video) return;

    setLoading(true);
    setError("");

    try {
      // 1. Upload media first
      let uploadedImages: string[] = [];
      let uploadedVideo: string | undefined = undefined;

      if (images.length > 0) {
        uploadedImages = await Promise.all(images.map(img => uploadToCloudinary(img, 'image')));
      } else if (video) {
        uploadedVideo = await uploadToCloudinary(video, 'video');
      }

      // 2. Submit post
      const token = localStorage.getItem("timber_token");
      const postBody = { 
        text, 
        images: uploadedImages, 
        video: uploadedVideo 
      };
      console.log("[CreatePost_API_POST]", postBody);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(postBody),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to publish post.");
      }
    } catch (err) {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-page">
      {/* Custom Header matching mockup */}
      <header className="h-16 px-6 bg-surface border-b border-timber-border flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-timber-text">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-timber-text">Create Post</h1>
        <button 
          onClick={handleSubmit}
          disabled={loading || (!text.trim() && images.length === 0 && !video)}
          className="bg-timber-btn-bg text-timber-btn-text px-8 py-2 rounded-full font-bold shadow-lg shadow-timber-brand/30 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </header>

      <main className="flex-grow max-w-2xl mx-auto w-full p-6">
        {/* User Identity Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-timber-border bg-elevated">
              <img 
                src={user?.avatar || "/default-avatar.svg"} 
                alt="Me" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4ADE80] border-2 border-surface rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-timber-text text-lg leading-tight">{user?.name || "Anonymous"}</h3>
            <div className="flex items-center gap-1.5 text-timber-muted">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
               </svg>
               <span className="text-xs font-bold uppercase tracking-wider">Public</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 text-red-600 rounded-2xl text-sm font-medium border border-red-100 dark:border-red-900 animate-shake">
            {error}
          </div>
        )}

        {uploadError && (
          <div className="mb-6 text-[#A32D2D] text-sm font-bold animate-pulse">
            {uploadError}
          </div>
        )}

        {/* Post Input */}
        <textarea
          autoFocus
          placeholder="What's on your mind?"
          className="w-full bg-transparent border-none focus:ring-0 text-lg text-timber-text placeholder-timber-placeholder resize-none min-h-[140px] py-2 px-0 mb-8"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mb-4">
          <h4 className="text-[14px] font-bold text-timber-muted uppercase tracking-widest mb-4">Add Media</h4>
          
          <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1 no-scrollbar items-start">
             {/* Add Image Card */}
             <button 
               onClick={() => document.getElementById('image-picker')?.click()}
               disabled={!!video || images.length >= 4}
               className="flex-shrink-0 w-[140px] h-[200px] border-2 border-dashed border-timber-border rounded-[24px] flex flex-col items-center justify-center gap-3 bg-timber-elevated active:scale-95 transition-all disabled:opacity-30"
             >
                <div className="w-10 h-10 rounded-full bg-timber-border flex items-center justify-center text-timber-text">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[13px] font-bold text-[#7C5A3E]">Add Photo</span>
             </button>

             {/* Add Video Card */}
             {!video && images.length === 0 && (
               <button 
                 onClick={() => document.getElementById('video-picker')?.click()}
                 className="flex-shrink-0 w-[140px] h-[200px] border-2 border-dashed border-timber-border rounded-[24px] flex flex-col items-center justify-center gap-3 bg-timber-elevated active:scale-95 transition-all"
               >
                  <div className="w-10 h-10 rounded-full bg-timber-border flex items-center justify-center text-timber-text">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-bold text-[#7C5A3E]">Add Video</span>
               </button>
             )}

             {images.map((file, idx) => (
               <div key={idx} className="flex-shrink-0 w-[140px] h-[200px] rounded-[24px] overflow-hidden relative group border border-timber-border shadow-sm">
                 <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                 <button 
                   onClick={() => removeImage(idx)}
                   className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
                 {uploadProgress[file.name] !== undefined && (
                   <div className="absolute bottom-0 left-0 h-1.5 bg-[#775839] transition-all duration-300" style={{ width: `${uploadProgress[file.name]}%` }}></div>
                 )}
               </div>
             ))}

             {video && (
               <div className="flex-shrink-0 w-[200px] h-[200px] rounded-[24px] overflow-hidden relative group border border-timber-border bg-black shadow-sm">
                 <video 
                   src={URL.createObjectURL(video)} 
                   className="w-full h-full object-cover" 
                   preload="metadata"
                 />
                 <button 
                   onClick={() => setVideo(null)}
                   className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
                 {uploadProgress[video.name] !== undefined && (
                   <div className="absolute bottom-0 left-0 h-1.5 bg-[#775839] transition-all duration-300" style={{ width: `${uploadProgress[video.name]}%` }}></div>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Hidden Inputs */}
        <input 
          type="file" 
          id="image-picker" 
          multiple 
          accept="image/jpeg,image/png,image/webp,image/gif" 
          className="hidden" 
          onChange={handleImagePick}
        />
        <input 
          type="file" 
          id="video-picker" 
          accept="video/mp4,video/quicktime,video/webm" 
          className="hidden" 
          onChange={handleVideoPick}
        />

        {/* Toolbar */}
        <div className="mt-4 flex items-center gap-4 border-t border-timber-border pt-6">
           <button 
             onClick={() => document.getElementById('image-picker')?.click()}
             disabled={!!video || images.length >= 4}
             className="p-2 text-timber-brand hover:bg-elevated rounded-full transition-colors disabled:opacity-30"
           >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
           </button>
           <button 
             onClick={() => document.getElementById('video-picker')?.click()}
             disabled={images.length > 0 || !!video}
             className="p-2 text-timber-brand hover:bg-elevated rounded-full transition-colors disabled:opacity-30"
           >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
           </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
