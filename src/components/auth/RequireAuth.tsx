import { type ReactNode } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { LockSimple, SignIn } from '@phosphor-icons/react';

interface RequireAuthProps {
  children: ReactNode;
  /** Feature ID to check — if premium and user is guest, show auth prompt */
  featureId?: string;
  /** Custom fallback UI when auth is required */
  fallback?: ReactNode;
  /** If true, renders children but wraps click with auth check (inline guard) */
  inline?: boolean;
}

function AuthPrompt({ featureId }: { featureId?: string }) {
  return (
    <div className="auth-prompt">
      <div className="auth-prompt-icon">
        <LockSimple size={28} weight="duotone" />
      </div>
      <h3 className="auth-prompt-title">Yêu cầu đăng nhập</h3>
      <p className="auth-prompt-desc">
        Tính năng {featureId ? `"${featureId}"` : 'này'} yêu cầu tài khoản KNReup.
        Đăng nhập để sử dụng đầy đủ các tính năng premium.
      </p>
      <button className="auth-prompt-btn" onClick={() => {/* TODO: open login flow */}}>
        <SignIn size={16} weight="bold" />
        Đăng nhập
      </button>
    </div>
  );
}

/**
 * Auth guard component - wraps premium features with login requirement.
 * In Guest Mode, shows a login prompt instead of children.
 */
export function RequireAuth({ children, featureId, fallback, inline }: RequireAuthProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isLocked = featureId
    ? useAuthStore((s) => s.isFeatureLocked(featureId))
    : !isLoggedIn;

  // Inline mode: render children but intercept click
  if (inline && isLocked) {
    return (
      <div
        style={{ position: 'relative', cursor: 'not-allowed', opacity: 0.6 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Show toast notification
          const toast = document.createElement('div');
          toast.className = 'auth-toast';
          toast.textContent = '🔒 Đăng nhập để sử dụng tính năng này';
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        }}
        title="Đăng nhập để sử dụng"
      >
        <div style={{ pointerEvents: 'none' }}>{children}</div>
        <LockSimple
          size={14}
          weight="fill"
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            color: 'var(--text-muted)',
          }}
        />
      </div>
    );
  }

  if (isLocked) {
    return fallback ? <>{fallback}</> : <AuthPrompt featureId={featureId} />;
  }

  return <>{children}</>;
}
