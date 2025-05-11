// src\components\Layout\LayoutProtectedExt.tsx
import { LayoutPublic } from '@happykiller/sunny-ui';
import { FooterExt } from '@components/layout/FooterExt';

export function LayoutPublicExt({ children }: { children: React.ReactNode }) {
  return (
    <LayoutPublic
      footer={<FooterExt />}
    >
      {children}
    </LayoutPublic>
  );
}
