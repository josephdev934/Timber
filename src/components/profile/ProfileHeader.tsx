interface ProfileHeaderProps {
  user: {
    name: string;
    username: string;
    avatar?: string;
    profilePhoto?: string;
    bio?: string;
  };
  stats?: {
    posts: number;
    interactions: number;
  };
  onPostsClick?: () => void;
  onInteractionsClick?: () => void;
  onEditClick?: () => void;
}

/**
 * ==========================================
 * COMPONENT: ProfileHeader
 * ==========================================
 */
export default function ProfileHeader({ 
  user, 
  stats = { posts: 0, interactions: 0 },
  onPostsClick,
  onInteractionsClick,
  onEditClick
}: ProfileHeaderProps) {
  const statItems = [
    { label: "POSTS", value: stats.posts, onClick: onPostsClick },
    { label: "INTERACTIONS", value: stats.interactions, onClick: onInteractionsClick },
  ];

  return (
    <div className="flex flex-col items-center pt-8 px-6 pb-6 bg-surface border-b border-timber-border">
      {/* Avatar */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-surface shadow-xl bg-elevated relative group">
          <img 
            src={user.profilePhoto || user.avatar || "/default-avatar.svg"} 
            alt={user.name} 
            className="w-full h-full object-cover" 
          />
          {onEditClick && (
            <div 
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={onEditClick}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#4ADE80] border-4 border-surface rounded-full shadow-sm" />
        
        {onEditClick && (
          <button 
            onClick={onEditClick}
            className="absolute bottom-1 -right-2 w-8 h-8 bg-timber-brand text-white rounded-full border-4 border-surface flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Name & Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-timber-text mb-1 tracking-tight">{user.name}</h2>
        <p className="text-timber-muted text-xs font-bold tracking-widest uppercase mb-3">@{user.username}</p>
        <p className="max-w-[280px] mx-auto text-timber-muted text-[13px] leading-relaxed">
          {user.bio || "No biography provided yet. Craft your digital story."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-4 w-full max-w-sm">
        {statItems.map((stat) => (
          <button 
            key={stat.label} 
            onClick={stat.onClick}
            className="flex-1 bg-elevated border border-timber-border p-4 rounded-[2rem] text-center shadow-sm hover:shadow-md hover:border-timber-brand/30 transition-all active:scale-95"
          >
            <div className="text-2xl font-bold text-timber-text mb-0.5 tracking-tight">{stat.value}</div>
            <div className="text-[10px] font-bold text-timber-muted tracking-[0.1em] uppercase">{stat.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
