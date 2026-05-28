import { Camera, User } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type ProfilePhotoPlaceholderProps = {
  imageUrl?: string | null;
  displayName?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_CLASSES = {
  sm: 'size-16 text-xs',
  md: 'size-24 text-sm',
  lg: 'size-32 text-base',
};

export function ProfilePhotoPlaceholder({
  imageUrl,
  displayName,
  className,
  size = 'md',
}: ProfilePhotoPlaceholderProps) {
  const initials = displayName
    ?.split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted',
        SIZE_CLASSES[size],
        className,
      )}
      aria-label={displayName ? `Profile photo for ${displayName}` : 'Profile photo placeholder'}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : initials ? (
        <span className="font-semibold text-muted-foreground">{initials}</span>
      ) : (
        <User className="size-1/3 text-muted-foreground" aria-hidden />
      )}
      <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border bg-background shadow-sm">
        <Camera className="size-3.5 text-muted-foreground" aria-hidden />
      </span>
    </div>
  );
}
